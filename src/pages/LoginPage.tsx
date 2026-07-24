import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import type { AuthTokens, User } from '../types';

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { isAuthenticated, setAuth } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  if (isAuthenticated) return <Navigate to="/map" replace />;

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const { data } = await api.post<AuthTokens>('/v1/auth/login', values);
      const { data: user } = await api.get<User>('/v1/auth/me', {
        headers: {
          Authorization: `Bearer ${data.accessToken}`,
        },
      });
      setAuth(data.accessToken, data.refreshToken, user);
      navigate('/map', { replace: true });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      const msg = e?.response?.data?.message;
      if (msg === 'Unauthorized' || msg?.toLowerCase().includes('invalid')) {
        setServerError('E-mail ou senha incorretos.');
      } else {
        setServerError('Erro ao conectar com o servidor. Tente novamente.');
      }
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at top, #ffffff 0, #f4f8fc 38%, #eaf2f9 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      {/* Background grid effect */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: 'linear-gradient(rgba(2,132,199,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(2,132,199,0.08) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          opacity: 0.55,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 400,
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img src="/logo.png" alt="Aquafort" style={{ width: 180, height: 'auto', display: 'block', margin: '0 auto' }} />
        </div>

        {/* Card */}
        <div
          style={{
            backgroundColor: 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(14px)',
            borderRadius: '18px',
            border: '1px solid var(--border)',
            padding: '32px',
            boxShadow: '0 20px 60px rgba(15, 23, 42, 0.10)',
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '24px' }}>
            Entrar na sua conta
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              error={errors.email?.message}
              autoComplete="email"
              {...register('email')}
            />

            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              autoComplete="current-password"
              {...register('password')}
            />

            {serverError && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(220,38,38,0.08)',
                  border: '1px solid rgba(220,38,38,0.2)',
                  color: 'var(--danger)',
                  fontSize: '13px',
                }}
              >
                {serverError}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isSubmitting}
              style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }}
            >
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: 'var(--text-muted)' }}>
          © {new Date().getFullYear()} Aquafort · Todos os direitos reservados
        </p>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
