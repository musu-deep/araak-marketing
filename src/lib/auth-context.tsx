import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { TeamMember, Role, RoleKey } from './types';
import { ADMIN_ROLES } from './constants';

interface MemberAccessResponse {
  ok: boolean;
  email?: string;
  first_login?: boolean;
  message?: string;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  member: TeamMember | null;
  role: Role | null;
  permissions: string[];
  isAdmin: boolean;
  loading: boolean;
  signIn: (fullName: string, phone: string, pin: string) => Promise<{ error: string | null; firstLogin?: boolean }>;
  signOut: () => Promise<void>;
  hasPermission: (key: string) => boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function normalizeDigits(value: string): string {
  const arabic = '٠١٢٣٤٥٦٧٨٩';
  const persian = '۰۱۲۳۴۵۶۷۸۹';
  return value
    .split('')
    .map((character) => {
      const arabicIndex = arabic.indexOf(character);
      if (arabicIndex >= 0) return String(arabicIndex);
      const persianIndex = persian.indexOf(character);
      return persianIndex >= 0 ? String(persianIndex) : character;
    })
    .join('');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [member, setMember] = useState<TeamMember | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMember = useCallback(async (authUser: User) => {
    try {
      const memberSelect = () => supabase
        .from('team_members')
        .select(`
          *,
          department:departments(*)
        `);

      let memberData: Record<string, unknown> | null = null;
      let memberError: { message: string } | null = null;

      const byAuthUser = await memberSelect().eq('auth_user_id', authUser.id).maybeSingle();
      memberData = byAuthUser.data as Record<string, unknown> | null;
      memberError = byAuthUser.error;

      const metadataMemberId = typeof authUser.user_metadata?.team_member_id === 'string'
        ? authUser.user_metadata.team_member_id
        : null;

      if (!memberData && metadataMemberId) {
        const byMetadata = await memberSelect().eq('id', metadataMemberId).maybeSingle();
        memberData = byMetadata.data as Record<string, unknown> | null;
        memberError = byMetadata.error;
      }

      if (!memberData && authUser.email) {
        const byEmail = await memberSelect().eq('email', authUser.email).maybeSingle();
        memberData = byEmail.data as Record<string, unknown> | null;
        memberError = byEmail.error;
      }

      if (memberError && !memberData) throw memberError;

      if (memberData) {
        const department = memberData.department as { name?: string } | null;
        const formattedMember: TeamMember = {
          ...(memberData as unknown as TeamMember),
          department_name: department?.name ?? undefined,
        };
        setMember(formattedMember);

        const { data: roleData } = await supabase
          .from('roles')
          .select('*')
          .eq('key', formattedMember.role_key)
          .maybeSingle();
        setRole(roleData ? roleData as Role : null);

        const { data: rolePerms } = await supabase
          .from('role_permissions')
          .select('permission_key')
          .eq('role_key', formattedMember.role_key);
        const rolePermKeys = (rolePerms ?? []).map((item: { permission_key: string }) => item.permission_key);

        const { data: userPerms } = await supabase
          .from('user_permissions')
          .select('permission_key, granted')
          .eq('team_member_id', formattedMember.id);

        const finalPerms = new Set(rolePermKeys);
        for (const userPermission of userPerms ?? []) {
          if (userPermission.granted) finalPerms.add(userPermission.permission_key);
          else finalPerms.delete(userPermission.permission_key);
        }
        setPermissions(Array.from(finalPerms));
      } else {
        setMember(null);
        setRole(null);
        setPermissions([]);
      }
    } catch (error) {
      console.error('Failed to load member:', error);
      setMember(null);
      setRole(null);
      setPermissions([]);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!mounted) return;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        loadMember(currentSession.user).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        void loadMember(currentSession.user);
      } else {
        setMember(null);
        setRole(null);
        setPermissions([]);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadMember]);

  const signIn = async (fullName: string, phone: string, pin: string) => {
    const normalizedPin = normalizeDigits(pin).replace(/\D/g, '');
    if (!fullName.trim()) return { error: 'أدخل الاسم كما هو مسجل في فريق المنصة.' };
    if (!phone.trim()) return { error: 'أدخل رقم الجوال المسجل.' };
    if (!/^\d{6}$/.test(normalizedPin)) return { error: 'الرمز الشخصي يجب أن يتكون من 6 أرقام.' };

    const { data, error: functionError } = await supabase.functions.invoke<MemberAccessResponse>('member-access', {
      body: {
        full_name: fullName.trim(),
        phone: phone.trim(),
        pin: normalizedPin,
      },
    });

    if (functionError) {
      return { error: 'تعذر الاتصال بخدمة الدخول. تأكد من نشر وظيفة member-access في Supabase.' };
    }
    if (!data?.ok || !data.email) {
      return { error: data?.message ?? 'تعذر التحقق من بيانات العضو.' };
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: normalizedPin,
    });

    if (authError) {
      return {
        error: authError.message === 'Invalid login credentials'
          ? 'الرمز الشخصي غير صحيح.'
          : authError.message,
      };
    }

    if (authData.user) await loadMember(authData.user);
    return { error: null, firstLogin: Boolean(data.first_login) };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setMember(null);
    setRole(null);
    setPermissions([]);
  };

  const hasPermission = useCallback(
    (key: string): boolean => {
      if (!member) return false;
      if (ADMIN_ROLES.includes(member.role_key as RoleKey)) return true;
      return permissions.includes(key);
    },
    [member, permissions]
  );

  const refresh = useCallback(async () => {
    if (user) {
      setLoading(true);
      await loadMember(user);
      setLoading(false);
    }
  }, [user, loadMember]);

  const isAdmin = member ? ADMIN_ROLES.includes(member.role_key as RoleKey) : false;

  return (
    <AuthContext.Provider
      value={{ session, user, member, role, permissions, isAdmin, loading, signIn, signOut, hasPermission, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
