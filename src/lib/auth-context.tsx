import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
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

  const loadMember = useCallback(async (_userId: string, email: string) => {
    try {
      const { data: memberData, error: memberError } = await supabase
        .from('team_members')
        .select(`
          *,
          department:departments(*)
        `)
        .eq('email', email)
        .maybeSingle();

      if (memberError) throw memberError;

      if (memberData) {
        const dept = memberData.department;
        const formattedMember: TeamMember = {
          ...memberData,
          department_name: dept?.name ?? null,
        };
        setMember(formattedMember);

        const { data: roleData } = await supabase
          .from('roles')
          .select('*')
          .eq('key', memberData.role_key)
          .maybeSingle();
        if (roleData) setRole(roleData as Role);

        // تحميل الصلاحيات: الدور الافتراضي + صلاحيات المستخدم المخصصة
        const { data: rolePerms } = await supabase
          .from('role_permissions')
          .select('permission_key')
          .eq('role_key', memberData.role_key);
        const rolePermKeys = (rolePerms ?? []).map((r: { permission_key: string }) => r.permission_key);

        const { data: userPerms } = await supabase
          .from('user_permissions')
          .select('permission_key, granted')
          .eq('team_member_id', memberData.id);

        const finalPerms = new Set(rolePermKeys);
        for (const up of userPerms ?? []) {
          if (up.granted) {
            finalPerms.add(up.permission_key);
          } else {
            finalPerms.delete(up.permission_key);
          }
        }
        setPermissions(Array.from(finalPerms));
      } else {
        setMember(null);
        setPermissions([]);
      }
    } catch (err) {
      console.error('Failed to load member:', err);
      setMember(null);
      setPermissions([]);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadMember(session.user.id, session.user.email ?? '').finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        (async () => {
          await loadMember(session.user.id, session.user.email ?? '');
        })();
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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
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
    if (user?.email) {
      setLoading(true);
      await loadMember(user.id, user.email);
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
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
