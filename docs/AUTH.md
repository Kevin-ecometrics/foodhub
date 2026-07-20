# Autenticación y roles (admin / waiter / super_admin)

## Resumen

El sistema usa **Supabase Auth real** (`auth.users`) en vez de tokens propios. Hay tres roles:

| Rol | Cómo se crea | Cómo entra |
|---|---|---|
| `super_admin` | Sincronizado automáticamente desde `ADMIN_USERNAME`/`ADMIN_PASSWORD` (env vars) la primera vez que se loguea con esas credenciales | `/admin` con `ADMIN_USERNAME`/`ADMIN_PASSWORD` |
| `admin` | Creado desde el panel (sección "Usuarios") por otro admin/super_admin | `/admin` con correo/contraseña |
| `waiter` | Creado desde el panel (sección "Usuarios") | `/waiter/login` con correo/contraseña **o** PIN de 4 dígitos |

El rol vive en `auth.users.raw_app_meta_data.role` (JWT `app_metadata`), no en la tabla `public.users`. `app_metadata` solo se puede escribir con la Admin API (service_role key) — el propio usuario no puede editarlo desde el cliente, a diferencia de `user_metadata`. Esto permite verificar el rol en middleware/rutas sin una consulta extra a la base de datos.

`public.users` guarda el perfil (nombre, email, rol denormalizado, PIN, `is_active`) y tiene RLS: cada usuario ve su propia fila, admin/super_admin ven todas. Es la única tabla del proyecto con RLS real por rol; el resto sigue "allow all" (fuera de alcance de este trabajo).

## Creación de cuentas sin correo de verificación

El panel de admin (`POST /api/admin/users`) usa `supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true, app_metadata: { role } })` con el cliente de service_role (`app/lib/supabase/admin.ts`). Al pasar `email_confirm: true` por la Admin API, la cuenta queda verificada de inmediato y **nunca se dispara el correo de confirmación** que sí envía `signUp()` normal. Luego se inserta el perfil en `public.users` con el mismo `id`.

Si el insert en `public.users` falla (ej. PIN duplicado), se hace rollback manual borrando el usuario recién creado en `auth.users` para no dejar cuentas huérfanas.

## Login por correo/contraseña

Flujo estándar de Supabase Auth (`supabase.auth.signInWithPassword`) ejecutado server-side en `app/api/auth/login/route.ts` (admin) y `app/api/auth/waiter-login/route.ts` (waiter), usando el cliente `app/lib/supabase/server.ts` (cookies via `@supabase/ssr`). Tras el login se valida que `app_metadata.role` sea el esperado para esa ruta; si no, se cierra la sesión y se responde 403.

## Login por PIN (solo waiter)

No existe "login con PIN" nativo en Supabase Auth, así que se arma con dos llamadas de la Admin API, sin pasar por contraseña ni enviar ningún correo:

1. Se busca en `public.users` (con el cliente service_role, que bypassa RLS) la fila con `pin_code` + `role='waiter'` + `is_active=true`, y se obtiene su `email`.
2. `supabaseAdmin.auth.admin.generateLink({ type: 'magiclink', email })` — esto **solo genera** un token, no envía nada.
3. `supabase.auth.verifyOtp({ email, token_hash, type: 'magiclink' })` con el cliente server (cookies) intercambia ese token por una sesión real de Supabase Auth, y las cookies quedan seteadas en la respuesta.

El resultado es indistinguible de un login normal: mismo JWT, mismo `app_metadata.role`, misma sesión.

## Super admin (env vars)

`ADMIN_USERNAME`/`ADMIN_PASSWORD` no son una cuenta "aparte": en `app/api/auth/login/route.ts`, si coinciden con las env vars, el servidor sincroniza una cuenta real en `auth.users` con email interno fijo `superadmin@internal.local` (no derivado de `ADMIN_USERNAME`, para que cambiar esa env var no cree una cuenta huérfana) y `app_metadata.role = 'super_admin'`:

- Si no existe, se crea (`auth.admin.createUser`).
- Si ya existe, se actualiza password/confirmación (`auth.admin.updateUserById`) para que quedar siempre en sync con el valor actual de `ADMIN_PASSWORD`.

Luego se hace un `signInWithPassword` real contra esa cuenta para setear la sesión. La cuenta de super admin no puede editarse ni eliminarse desde el panel de Usuarios.

## Protección de rutas

- `middleware.ts` exige sesión Supabase válida para `/waiter/**` (excepto `/waiter/login`) y para `/api/admin/**`, redirigiendo o devolviendo 401 si no hay sesión.
- `/admin` se gatea client-side (`app/admin/page.tsx`, `supabase.auth.getUser()` + chequeo de `app_metadata.role`) porque esa ruta ya renderiza el `LoginForm` inline cuando no hay sesión — no hace falta un redirect de middleware ahí.
- Las rutas `app/api/admin/users/**` además verifican explícitamente el rol server-side (`app/lib/supabase/authz.ts`) como defensa en profundidad, independiente del middleware.
- A nivel de base de datos, la RLS de `public.users` es la garantía real contra un bypass de middleware: un waiter autenticado que consulte `supabase.from('users').select('*')` solo puede ver su propia fila, nunca la lista completa.

## Gestión de cuentas (edición / desactivación / borrado)

- Desactivar una cuenta (`is_active=false`) también banea el login a nivel de Supabase Auth (`updateUserById({ ban_duration: '876000h' })`), no solo el flag `is_active` en `public.users` — bloquea logins/refresh de inmediato. El access token ya emitido antes de la desactivación sigue siendo válido hasta su expiración natural (~1h), porque GoTrue no expone un endpoint de admin para revocar sesiones por `user_id` — es una limitación conocida y aceptada (esfuerzo mínimo, ver riesgos del plan original).
- Un cambio de `role` (sin desactivar) tampoco revoca el JWT ya emitido; el nuevo rol aplica de inmediato para logins nuevos y para requests que vuelvan a pedir `getUser()`/refresquen el token.
- Nadie puede quitarse su propio rol de admin, desactivarse o eliminarse a sí mismo. La cuenta `super_admin` no se puede editar ni eliminar desde el panel.

## Variables de entorno requeridas

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ADMIN_USERNAME=
ADMIN_PASSWORD=
SUPABASE_SERVICE_ROLE_KEY=   # Dashboard > Settings > API > service_role
```

`SUPABASE_SERVICE_ROLE_KEY` nunca debe llevar el prefijo `NEXT_PUBLIC_` ni llegar a código que corra en el navegador — solo se importa desde `app/api/admin/**` y `app/api/auth/**` (ver `app/lib/supabase/admin.ts`).
