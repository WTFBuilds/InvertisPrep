"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useRef, useState } from 'react';
import { signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { optimizeAvatar } from '@/lib/avatar';
import {
  buildCanonicalLoginUrl,
  isSafeReturnPath,
  pickLoginParams,
  shouldTransitionAuthHost,
} from '@/lib/canonical';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Human-readable messages for NextAuth OAuth errors surfaced via ?error=…
// on the login URL (previously the form re-appeared with no explanation).
const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  OAuthCallback: "Google sign-in couldn't be completed. Please try again.",
  OAuthSignin: "Google sign-in couldn't be started. Please try again.",
  OAuthAccountNotLinked: 'This email is already linked to a different sign-in method.',
  AccessDenied: 'Access was denied. Please try again.',
  Configuration: 'There is a sign-in configuration problem. Please contact support.',
};

// NextAuth callbackUrl: return to /login keeping the current context (webview
// flow, intended destination) so the post-auth handler can finish the job.
const buildLoginCallbackUrl = (): string => {
  const params = pickLoginParams(window.location.search);
  const search = new URLSearchParams();
  if (params.webview) search.set('webview', params.webview);
  if (params.mobile) search.set('mobile', params.mobile);
  if (isSafeReturnPath(params.returnUrl)) search.set('returnUrl', params.returnUrl);
  const qs = search.toString();
  return `/login${qs ? `?${qs}` : ''}`;
};

// Warm the browser cache for the avatar URL so the navbar shows the user's
// picture instantly after redirect instead of fetching it on the next page.
const preloadAvatar = (url?: string) => {
  const src = optimizeAvatar(url);
  if (!src) return;
  if (typeof window !== 'undefined') {
    const img = new window.Image();
    img.referrerPolicy = 'no-referrer';
    img.src = src;
  }
};

// Slide/fade used between the email → password/register steps.
const stepMotion = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
  transition: { duration: 0.22, ease: 'easeOut' as const },
};

export default function LoginPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handledCallbackRef = useRef(false);
  const router = useRouter();
  const { login, updateUser, user, loading: authLoading } = useAuth();

  const [mode, setMode] = useState<'student' | 'admin'>('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Student email flow: email → password (existing account) | register (new account)
  const [step, setStep] = useState<'email' | 'password' | 'register'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isWebViewAuthFlow, setIsWebViewAuthFlow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    setIsWebViewAuthFlow(params.get('webview') === '1' || params.get('mobile') === '1');
  }, []);

  // Where to send the user after a successful login: an explicit ?returnUrl=
  // wins; otherwise the last page they were on while logged out (captured by
  // AuthContext in sessionStorage); homepage as the final fallback.
  const resolveReturnUrl = (): string => {
    if (typeof window === 'undefined') return '/';
    const params = new URLSearchParams(window.location.search);
    const url = params.get('returnUrl');
    if (url && url.startsWith('/') && !url.startsWith('/login')) return url;
    try {
      const stored = sessionStorage.getItem('returnTo');
      if (stored && stored.startsWith('/') && !stored.startsWith('/login')) return stored;
    } catch {
      // sessionStorage unavailable
    }
    return '/';
  };

  // Once the auth state resolves, a logged-in user has no business sitting on
  // the login page — this covers returning to /login after signing in (back
  // button, bookmark) and any case where a completed login didn't navigate.
  // (resolveReturnUrl is intentionally not a dependency: it reads window
  // state fresh on every call.)
  useEffect(() => {
    if (!authLoading && user) {
      router.replace(resolveReturnUrl());
    }
  }, [authLoading, user, router]);

  // Handle URL parameters safely on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('role') === 'admin' || params.get('mode') === 'admin') {
        setMode('admin');
      }
    }
  }, []);

  // Handle checking for NextAuth session on mount (to handle OAuth callback redirect)
  useEffect(() => {
    if (handledCallbackRef.current) {
      return;
    }
    // Set immediately to prevent double-execution in React strict mode
    handledCallbackRef.current = true;

    const handleGoogleCallback = async () => {
      try {
        const res = await fetch('/api/auth/session');
        const session = await res.json();

        if (session?.idToken) {
          setLoading(true);
          setError('');

          // Send the ID token to our backend
          const response = await api.post('/auth/google-login', {
            token: session.idToken
          });

          if (response.data?.success && response.data?.token) {
            // Call NextAuth signout to clear the NextAuth session so it doesn't linger
            await signOut({ redirect: false });

            // Keep the web app auth state in sync before the native app consumes the deep link.
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            updateUser(response.data.user);
            preloadAvatar(response.data.user.picture);

            if (isWebViewAuthFlow && typeof window !== 'undefined') {
              const callbackUrl = new URL('invertisprep://auth/callback');
              callbackUrl.searchParams.set('token', response.data.token);

              // Pass the user object to the native app so it can write both
              // `token` AND `user` into the WebView's localStorage (AuthContext
              // requires both). Encode as base64 of UTF-8 bytes to stay
              // URL-safe and unicode-safe (btoa() is ASCII-only).
              const userJson = JSON.stringify(response.data.user);
              const userB64 = btoa(
                encodeURIComponent(userJson).replace(
                  /%([0-9A-F]{2})/g,
                  (_, p) => String.fromCharCode(parseInt(p, 10))
                )
              );
              callbackUrl.searchParams.set('user', userB64);

              window.location.replace(callbackUrl.toString());
              return;
            }

            // Check for returnUrl parameter - redirect there if present
            // (validated: in-app relative paths only, never an open redirect)
            const searchParams = new URLSearchParams(window.location.search);
            const returnUrl = searchParams.get('returnUrl');
            if (isSafeReturnPath(returnUrl)) {
              // Migrate guest resume if exists
              const guestResumeData = localStorage.getItem('resume-builder-guest-draft');
              if (guestResumeData) {
                try {
                  const guestResume = JSON.parse(guestResumeData);
                  // Import the API and create the resume
                  const { resumeApi } = await import('@/lib/api');
                  const migrateResponse = await resumeApi.create(guestResume);
                  if (migrateResponse.data) {
                    // Clear guest data after successful save
                    localStorage.removeItem('resume-builder-guest-draft');
                    // Redirect to resume builder with the new ID
                    router.push(`/resume-builder?id=${migrateResponse.data._id}`);
                    return;
                  }
                } catch (error) {
                  console.error('Failed to migrate guest resume:', error);
                  // Continue with normal redirect even if migration fails
                }
              }
              // Default redirect if no guest resume
              router.push(returnUrl);
            } else {
              // Back to the page the user came from (or homepage)
              router.push(resolveReturnUrl());
            }
          } else {
            setError(response.data?.message || 'Failed to authenticate with server');
            setLoading(false);
          }
        } else {
          // One-click continuation: the user clicked "Continue with Google"
          // on a public/SEO domain and was handed off here (auto=google).
          // Start the OAuth flow now that the page sits on the canonical auth
          // domain. The error guard prevents a failed attempt from looping.
          const params = new URLSearchParams(window.location.search);
          if (params.get('auto') === 'google' && !params.get('error')) {
            await handleGoogleLogin();
          }
        }
      } catch (error: any) {
        console.error('Google callback error:', error);
        const serverMessage = error?.response?.data?.message || error?.response?.data?.details || error?.message;
        setError(serverMessage ? `Google sign-in error: ${serverMessage}` : 'An error occurred while finishing Google sign-in.');
        setLoading(false);
      }
    };

    handleGoogleCallback();
  }, [isWebViewAuthFlow, router, updateUser]);

  // Social sign-in handler
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');

      // OAuth is stateful (host-scoped state/PKCE cookies plus a fixed
      // redirect_uri), so the round-trip must start on the canonical auth
      // domain. From a public/SEO host, hand the flow over first; auto=google
      // continues the click there so the user still only clicks once.
      if (
        typeof window !== 'undefined' &&
        shouldTransitionAuthHost(window.location.hostname)
      ) {
        window.location.href = buildCanonicalLoginUrl(
          '/login',
          pickLoginParams(window.location.search),
          { autoGoogle: true }
        );
        return;
      }

      await signIn('google', { callbackUrl: buildLoginCallbackUrl() });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred during Google login';
      setError(errorMsg);
      setLoading(false);
    }
  };

  // ── Student email flow ────────────────────────────────────────────────────

  // Step 1: route the entered email to the right next step.
  const handleEmailContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalized)) {
      setError('Enter a valid email address');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const { data: res } = await api.post('/auth/check-email', { email: normalized });

      if (!res?.success) {
        setError(res?.message || 'Something went wrong. Please try again.');
        return;
      }

      if (res.data.isGoogleLinked) {
        // Account was created via Google — password sign-in can't work here.
        setError('This email is already linked with Google. Please continue with Google below.');
        return;
      }

      if (res.data.exists && res.data.isActive === false) {
        setError('This account has been disabled. Contact support for help.');
        return;
      }

      // Existing password account → sign-in step; new email → registration.
      setStep(res.data.exists ? 'password' : 'register');
    } catch (err: any) {
      const serverMessage = err?.response?.data?.message || err?.message;
      setError(serverMessage || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2a: existing password account — sign in (redirect handled by AuthContext).
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Enter your password');
      return;
    }

    setError('');
    setLoading(true);
    try {
      // Send the user back to the page they came from (homepage by default).
      await login({ email: email.trim().toLowerCase(), password }, resolveReturnUrl());
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || 'Login failed. Please check your password.');
      setLoading(false);
    }
  };

  // Step 2b: brand-new email — create the account, then enter the app directly.
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = email.trim().toLowerCase();
    const digits = phoneNumber.replace(/\D/g, '');

    if (fullName.trim().length < 2) {
      setError('Enter your full name');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!/^\d{10}$/.test(digits)) {
      setError('Enter a valid 10-digit phone number');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const { data: res } = await api.post('/auth/register', {
        email: normalized,
        name: fullName.trim(),
        password,
        phoneNumber: digits,
      });

      if (res?.success && res?.token && res?.user) {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        updateUser(res.user);
        preloadAvatar(res.user.picture);
        router.push(resolveReturnUrl());
      } else {
        setError(res?.message || 'Failed to create account');
        setLoading(false);
      }
    } catch (err: any) {
      const serverMessage = err?.response?.data?.message;
      setError(serverMessage || 'Failed to create account. Please try again.');
      setLoading(false);
    }
  };

  const backToEmail = () => {
    setStep('email');
    setPassword('');
    setShowPassword(false);
    setFullName('');
    setPhoneNumber('');
    setError('');
  };

  // Admin Login Submission
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email, password });
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // ThreeJS Dynamic Interactive Background
  useEffect(() => {
    let active = true;
    let renderer: any;
    let geometry: any;
    let material: any;
    let scene: any;
    let camera: any;
    let animationId: number;
    let cleanUpResize: (() => void) | undefined;

    const initThree = (THREE: any) => {
      if (!canvasRef.current || !active) return;
      const canvas = canvasRef.current;
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: false,
      });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);

      scene = new THREE.Scene();
      camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 0.1);

      const uniforms = {
        u_time: { value: 0.0 },
        u_resolution: { value: new THREE.Vector2(window.innerWidth * 2, window.innerHeight * 2) },
        u_mouse: { value: new THREE.Vector2(-999.0, -999.0) },
        u_opacities: {
          value: [0.12, 0.12, 0.16, 0.20, 0.24, 0.28, 0.32, 0.36, 0.40, 0.45],
        },
        u_colors: {
          value: [
            new THREE.Vector3(0.39, 0.45, 0.95), // Indigo
            new THREE.Vector3(0.58, 0.31, 0.89), // Violet
            new THREE.Vector3(0.12, 0.74, 0.74), // Teal
            new THREE.Vector3(0.47, 0.55, 0.63), // Slate gray
            new THREE.Vector3(0.93, 0.39, 0.58), // Rose
            new THREE.Vector3(0.3, 0.5, 0.9), // Blue
          ],
        },
        u_total_size: { value: 24.0 },
        u_dot_size: { value: 5.0 },
        u_reverse: { value: 0 },
      };

      material = new THREE.ShaderMaterial({
        vertexShader: `
          precision mediump float;
          uniform vec2 u_resolution;
          out vec2 fragCoord;
          void main(){
            gl_Position = vec4(position, 1.0);
            fragCoord = (position.xy + vec2(1.0)) * 0.5 * u_resolution;
            fragCoord.y = u_resolution.y - fragCoord.y;
          }
        `,
        fragmentShader: `
          precision mediump float;
          in vec2 fragCoord;

          uniform float u_time;
          uniform float u_opacities[10];
          uniform vec3 u_colors[6];
          uniform float u_total_size;
          uniform float u_dot_size;
          uniform vec2 u_resolution;
          uniform vec2 u_mouse;
          uniform int u_reverse;

          out vec4 fragColor;

          float PHI = 1.61803398874989484820459;
          float random(vec2 xy) {
              return fract(tan(distance(xy * PHI, xy) * 0.5) * xy.x);
          }

          void main() {
              vec2 st = fragCoord.xy;
              st.x -= abs(floor((mod(u_resolution.x, u_total_size) - u_dot_size) * 0.5));
              st.y -= abs(floor((mod(u_resolution.y, u_total_size) - u_dot_size) * 0.5));

              float opacity = step(0.0, st.x) * step(0.0, st.y);

              vec2 st2 = vec2(int(st.x / u_total_size), int(st.y / u_total_size));

              float frequency = 6.0;
              float show_offset = random(st2);
              float rand = random(st2 * floor((u_time / frequency) + show_offset + frequency));
              opacity *= u_opacities[int(rand * 10.0)];
              opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.x / u_total_size));
              opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.y / u_total_size));

              vec3 color = u_colors[int(show_offset * 6.0)];

              float animation_speed_factor = 2.0;
              vec2 center_grid = u_resolution / 2.0 / u_total_size;
              float dist_from_center = distance(center_grid, st2);

              float timing_offset_intro = dist_from_center * 0.008 + (random(st2) * 0.12);

              float current_timing_offset = timing_offset_intro;
              opacity *= step(current_timing_offset, u_time * animation_speed_factor);
              opacity *= clamp((1.0 - step(current_timing_offset + 0.1, u_time * animation_speed_factor)) * 1.25, 1.0, 1.25);

              // Mouse interaction: dots near cursor glow brighter
              vec2 mouse_grid = u_mouse / u_total_size;
              float dist_from_mouse = distance(mouse_grid, st2);
              float mouse_radius = 6.0; // grid-cell radius of influence
              float mouse_strength = 1.0 - smoothstep(0.0, mouse_radius, dist_from_mouse);

              // Boost opacity and shift colour toward white near cursor
              opacity = mix(opacity, min(opacity * 3.5, 0.95), mouse_strength * 0.85);
              color = mix(color, vec3(0.55, 0.40, 1.0), mouse_strength * 0.5);

              fragColor = vec4(color, opacity);
              fragColor.rgb *= fragColor.a;
          }
        `,
        uniforms: uniforms,
        glslVersion: THREE.GLSL3,
        transparent: true,
      });

      geometry = new THREE.PlaneGeometry(2, 2);
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      const startTime = performance.now();
      const animate = () => {
        if (!active) return;
        animationId = requestAnimationFrame(animate);
        uniforms.u_time.value = (performance.now() - startTime) / 1000.0;
        renderer.render(scene, camera);
      };
      animate();

      const handleResize = () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        uniforms.u_resolution.value.set(window.innerWidth * 2, window.innerHeight * 2);
      };
      window.addEventListener('resize', handleResize);

      // Smooth eased mouse tracking
      let targetMouseX = -999.0;
      let targetMouseY = -999.0;
      let currentMouseX = -999.0;
      let currentMouseY = -999.0;
      const handleMouseMove = (e: MouseEvent) => {
        targetMouseX = e.clientX * 2;
        targetMouseY = e.clientY * 2;
      };
      window.addEventListener('mousemove', handleMouseMove);

      // Override animate to include mouse easing
      cancelAnimationFrame(animationId);
      const easeAnimate = () => {
        if (!active) return;
        animationId = requestAnimationFrame(easeAnimate);
        uniforms.u_time.value = (performance.now() - startTime) / 1000.0;
        // Lerp toward target for smooth follow
        let percent = 0.06;
        currentMouseX += (targetMouseX - currentMouseX) * percent;
        currentMouseY += (targetMouseY - currentMouseY) * percent;
        uniforms.u_mouse.value.set(currentMouseX, currentMouseY, 0.0);
        renderer.render(scene, camera);
      };
      easeAnimate();

      cleanUpResize = () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('mousemove', handleMouseMove);
      };
    };

    // Dynamically load Three.js via script tag to avoid bundler import errors
    if ((window as any).THREE) {
      initThree((window as any).THREE);
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      script.async = true;
      script.onload = () => {
        if ((window as any).THREE && active) {
          initThree((window as any).THREE);
        }
      };
      document.head.appendChild(script);
    }

    return () => {
      active = false;
      if (cleanUpResize) cleanUpResize();
      if (animationId) cancelAnimationFrame(animationId);
      if (renderer) renderer.dispose();
      if (geometry) geometry.dispose();
      if (material) material.dispose();
    };
  }, []);

  /* ─── Google SVG ─── */
  const GoogleIcon = (
    <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, flexShrink: 0 }}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 16.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );

  const Footer = (
    <div style={{ marginTop: "0.85rem", fontSize: "0.75rem", color: "#64748b", lineHeight: 1.5, textAlign: "center" }}>
      By proceeding, you agree to creating an account<br />subject to our{" "}
      <Link href="/terms-of-service" style={{ color: "#475569", fontWeight: 500, textDecoration: "underline" }}>Terms of Service</Link> and <Link href="/privacy-policy" style={{ color: "#475569", fontWeight: 500, textDecoration: "underline" }}>Privacy Policy</Link>.
    </div>
  );

  return (
    <div style={{
      position: "relative",
      width: "100%",
      height: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
      color: "#0f172a",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      {/* WebGL Dot Canvas */}
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, zIndex: 0 }} />

      {/* Light Theme Vignette Overlay */}
      <div style={{
        position: "absolute",
        inset: 0,
        zIndex: 1,
        background: "radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, rgba(241,245,249,0.85) 100%)",
        pointerEvents: "none",
      }} />

      {/* Card Content Container */}
      <div style={{
        position: "relative",
        zIndex: 2,
        background: "rgba(255, 255, 255, 0.85)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderRadius: 16,
        padding: "2.25rem 2rem",
        width: "100%",
        maxWidth: 400,
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02), 0 0 1px 1px rgba(0, 0, 0, 0.02)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        border: "1px solid rgba(226, 232, 240, 0.8)"
      }}>

        {/* Error notification display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              width: "100%",
              padding: "0.75rem 1rem",
              backgroundColor: "#fef2f2",
              border: "1px solid #fee2e2",
              borderRadius: 8,
              color: "#b91c1c",
              fontSize: "0.825rem",
              marginBottom: "1rem",
              textAlign: "center",
              lineHeight: 1.4
            }}>
            {error}
          </motion.div>
        )}

        {/* 1. STUDENT FLOW */}
        {mode === 'student' && (
          <AnimatePresence mode="wait" initial={false}>
            {/* Step: email */}
            {step === 'email' && (
              <motion.div key="step-email" {...stepMotion} style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                <h1 style={{ fontSize: "1.35rem", fontWeight: 700, marginBottom: "0.25rem", color: "#0f172a", letterSpacing: "-0.025em" }}>Sign in to InvertisPrep</h1>
                <p style={{ fontSize: "0.85rem", color: "#475569", marginBottom: "1.25rem", lineHeight: 1.5 }}>Access your academic study materials.</p>

                <form onSubmit={handleEmailContinue} style={{ width: "100%", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                  <input
                    className="login-input"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <button type="submit" className="login-button-primary" disabled={loading}>
                    {loading ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                        <Loader2 size={14} className="animate-spin" /> Checking...
                      </span>
                    ) : (
                      'Continue with Email'
                    )}
                  </button>
                </form>

                <div style={{ height: 1, background: "#e2e8f0", width: "100%", margin: "1rem 0", position: "relative" }}>
                  <span style={{ position: "absolute", top: "-0.6em", left: "50%", transform: "translateX(-50%)", background: "rgba(255,255,255,0.9)", padding: "0 0.6rem", fontSize: "0.7rem", color: "#94a3b8" }}>or</span>
                </div>

                <button className="login-button-social" onClick={handleGoogleLogin} disabled={loading}>
                  {GoogleIcon} Continue with Google
                </button>

                <div style={{ marginTop: "1rem", fontSize: "0.875rem", color: "#475569" }}>
                  <button
                    onClick={() => { setMode('admin'); setError(''); }}
                    style={{ background: "none", border: "none", color: "#6366f1", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", fontSize: "inherit", textDecoration: "underline" }}
                  >
                    Login as Team
                  </button>
                </div>

                {Footer}
              </motion.div>
            )}

            {/* Step: password (existing account) */}
            {step === 'password' && (
              <motion.div key="step-password" {...stepMotion} style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                <button
                  onClick={backToEmail}
                  style={{ background: "none", border: "none", color: "#64748b", fontSize: "0.8rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, alignSelf: "flex-start", marginBottom: "0.5rem", fontFamily: "inherit" }}
                >
                  <ArrowLeft size={13} /> Back
                </button>
                <h1 style={{ fontSize: "1.35rem", fontWeight: 700, marginBottom: "0.25rem", color: "#0f172a", letterSpacing: "-0.025em" }}>Welcome back</h1>
                <p style={{ fontSize: "0.85rem", color: "#475569", marginBottom: "1.25rem", lineHeight: 1.5 }}>
                  Signing in as <span style={{ fontWeight: 600, color: "#0f172a" }}>{email}</span>
                </p>

                <form onSubmit={handlePasswordSubmit} style={{ width: "100%", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                  <div style={{ position: "relative" }}>
                    <input
                      className="login-input"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Your password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      autoFocus
                      disabled={loading}
                      style={{ paddingRight: "2.6rem" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#94a3b8", cursor: "pointer", display: "flex", padding: 2 }}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <button type="submit" className="login-button-primary" disabled={loading}>
                    {loading ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                        <Loader2 size={14} className="animate-spin" /> Signing in...
                      </span>
                    ) : (
                      'Sign In'
                    )}
                  </button>
                </form>

                {Footer}
              </motion.div>
            )}

            {/* Step: register (new account) */}
            {step === 'register' && (
              <motion.div key="step-register" {...stepMotion} style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                <button
                  onClick={backToEmail}
                  style={{ background: "none", border: "none", color: "#64748b", fontSize: "0.8rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, alignSelf: "flex-start", marginBottom: "0.5rem", fontFamily: "inherit" }}
                >
                  <ArrowLeft size={13} /> Back
                </button>
                <h1 style={{ fontSize: "1.35rem", fontWeight: 700, marginBottom: "0.25rem", color: "#0f172a", letterSpacing: "-0.025em" }}>Create your account</h1>
                <p style={{ fontSize: "0.85rem", color: "#475569", marginBottom: "1.25rem", lineHeight: 1.5 }}>
                  for <span style={{ fontWeight: 600, color: "#0f172a" }}>{email}</span> — takes 10 seconds.
                </p>

                <form onSubmit={handleRegisterSubmit} style={{ width: "100%", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                  <input
                    className="login-input"
                    type="text"
                    placeholder="Full name"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    required
                    autoFocus
                    disabled={loading}
                    minLength={2}
                    maxLength={60}
                  />
                  <div style={{ position: "relative" }}>
                    <input
                      className="login-input"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      minLength={8}
                      style={{ paddingRight: "2.6rem" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#94a3b8", cursor: "pointer", display: "flex", padding: 2 }}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <p style={{ fontSize: "0.7rem", color: "#94a3b8", margin: "-0.3rem 0 0", textAlign: "left" }}>
                    Minimum 8 characters.
                  </p>
                  <input
                    className="login-input"
                    type="tel"
                    placeholder="Phone number (10 digits)"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value.replace(/[^\d]/g, '').slice(0, 10))}
                    required
                    disabled={loading}
                    inputMode="numeric"
                    pattern="\d{10}"
                  />
                  <button type="submit" className="login-button-primary" disabled={loading}>
                    {loading ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                        <Loader2 size={14} className="animate-spin" /> Creating account...
                      </span>
                    ) : (
                      'Create account & Sign in'
                    )}
                  </button>
                </form>

                {Footer}
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* 2. TEAM ADMIN LOGIN MODE */}
        {mode === 'admin' && (
          <div style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <h1 style={{ fontSize: "1.35rem", fontWeight: 700, marginBottom: "0.25rem", color: "#0f172a", letterSpacing: "-0.025em" }}>Team Admin Sign In</h1>
            <p style={{ fontSize: "0.85rem", color: "#475569", marginBottom: "1.25rem", lineHeight: 1.5 }}>Sign in to manage PYQ papers and dashboard.</p>

            <form onSubmit={handleAdminSubmit} style={{ width: "100%", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ width: "100%", textAlign: "left" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569", display: "block", marginBottom: "0.35rem" }}>Email</label>
                <input
                  className="login-input"
                  type="email"
                  placeholder="superadmin@invertis.edu.in"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div style={{ width: "100%", textAlign: "left" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569", display: "block", marginBottom: "0.35rem" }}>Password</label>
                <input
                  className="login-input"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <button type="submit" className="login-button-primary" style={{ marginTop: "0.5rem" }} disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In as Team'}
              </button>
            </form>

            <div style={{ height: 1, background: "#e2e8f0", width: "100%", margin: "1.25rem 0" }} />

            <button
              onClick={() => { setMode('student'); setStep('email'); setError(''); }}
              style={{ background: "none", border: "none", color: "#6366f1", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" }}
            >
              Back to Student Sign In
            </button>

            {Footer}
          </div>
        )}
      </div>

      {/* Styled Interactive Effects for Focus & Hover states without Tailwind */}
      <style jsx global>{`
        .login-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #0f172a;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .login-input::placeholder {
          color: #94a3b8;
        }
        .login-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
        }
        .login-button-primary {
          width: 100%;
          padding: 0.75rem;
          border-radius: 8px;
          border: none;
          background: #0f172a;
          color: #ffffff;
          font-weight: 500;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .login-button-primary:hover {
          background: #1e293b;
        }
        .login-button-primary:active {
          background: #1e293b;
        }
        .login-button-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .login-button-social {
          width: 100%;
          padding: 0.65rem;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          color: #334155;
          font-weight: 500;
          font-size: 0.875rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          transition: all 0.2s;
        }
        .login-button-social:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }
        .login-button-social:active {
          background: #f1f5f9;
        }
        .login-button-social:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
