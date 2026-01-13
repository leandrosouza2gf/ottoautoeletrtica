-- =====================================================
-- SECURITY FIX: Fix RLS policies and secure functions
-- =====================================================

-- 1. DROP the dangerous make_user_admin function (bootstrap use only)
-- This function has no auth checks and allows privilege escalation
DROP FUNCTION IF EXISTS public.make_user_admin(TEXT);

-- 2. FIX PROFILES TABLE RLS POLICIES
-- Problem: All policies are RESTRICTIVE (AND logic) instead of PERMISSIVE (OR logic)
-- This means users must match ALL conditions, which breaks access

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Recreate as PERMISSIVE policies (default when not specified = PERMISSIVE)
CREATE POLICY "Users can view own profile" ON profiles 
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = id);
  
CREATE POLICY "Users can update own profile" ON profiles 
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = id);
  
CREATE POLICY "Admins can view all profiles" ON profiles 
  FOR SELECT 
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
  
CREATE POLICY "Admins can update all profiles" ON profiles 
  FOR UPDATE 
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. FIX USER_ROLES TABLE RLS POLICIES
DROP POLICY IF EXISTS "Users can view own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON user_roles;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Users can view own role" ON user_roles 
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);
  
CREATE POLICY "Admins can view all roles" ON user_roles 
  FOR SELECT 
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. CREATE SECURE RPC FUNCTION FOR ROLE MANAGEMENT
-- This replaces direct client-side manipulation with proper authorization
CREATE OR REPLACE FUNCTION public.update_user_role(
  target_user_id UUID,
  new_role app_role
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- AUTH CHECK: Only existing admins can change roles
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;
  
  -- SELF-PROTECTION: Prevent admins from demoting themselves
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot change your own role';
  END IF;
  
  -- Delete existing role
  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  
  -- Insert new role
  INSERT INTO public.user_roles (user_id, role) VALUES (target_user_id, new_role);
END;
$$;

-- 5. CREATE SECURE RPC FUNCTION FOR ADMIN USER CREATION
-- This allows admins to set roles for newly created users
CREATE OR REPLACE FUNCTION public.set_user_role_on_create(
  target_user_id UUID,
  target_role app_role
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- AUTH CHECK: Only existing admins can set roles
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;
  
  -- Delete existing role if any
  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  
  -- Insert the role
  INSERT INTO public.user_roles (user_id, role) VALUES (target_user_id, target_role);
END;
$$;

-- 6. BOOTSTRAP FUNCTION: Only works when NO admins exist
-- This is the secure way to create the first admin
CREATE OR REPLACE FUNCTION public.bootstrap_first_admin()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count INTEGER;
BEGIN
  -- Check if any admin exists
  SELECT COUNT(*) INTO admin_count
  FROM public.user_roles
  WHERE role = 'admin';
  
  -- Only allow if no admins exist
  IF admin_count > 0 THEN
    RAISE EXCEPTION 'Bootstrap not allowed: Admin already exists';
  END IF;
  
  -- Make the calling user an admin
  DELETE FROM public.user_roles WHERE user_id = auth.uid();
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'admin');
END;
$$;