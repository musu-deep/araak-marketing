import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { institutionalSignIn } from './institutional-api';
import type { TeamMember, Role, RoleKey } from './types';
import { ADMIN_ROLES } from './constants';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  member: TeamMember | null;
  role: Role | null;
  permissions: string[];
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  hasPermission: (key: string) => boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

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

  const signIn = async (email: string, password: string) => {
    const normalisedEmail = email.trim().toLowerCase();
    if (!normalisedEmail) return { error: 'أدخل البريد المؤسسي المستخدم في منصة ARAAK CEO.' };
    if (!password) return { error: 'أدخل كلمة المرور المؤسسية.' };

    try {
      const institutional = await institutionalSignIn(normalisedEmail, password);
      const { data, error } = await supabase.auth.setSession({
        access_token: institutional.session.access_token,
        refresh_token: institutional.session.refresh_token,
      });

      if (error || !data.user) {
        return { error: error?.message || 'تعذر إنشاء جلسة المنصة.' };
      }

      await loadMember(data.user);
      return { error: null };
    } catch (error) {
      return {
        error: error instanceof Error
          ? error.message
          : 'تعذر الاتصال ببوابة الهوية المؤسسية.',
      };
    }
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
