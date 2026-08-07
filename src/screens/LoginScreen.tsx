import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowLeft, Briefcase, Phone, ShieldCheck, Wrench } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { OtpInput } from '../components/ui/OtpInput';
import { formatPhoneBR, isValidPhoneBR } from '../utils/phone';

const DEMO_OTP_CODE = '1234';

type LoginStep = 'phone' | 'otp';

export function LoginScreen() {
  const { users, login } = useAppContext();

  const [step, setStep] = useState<LoginStep>('phone');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isSendingCode, setIsSendingCode] = useState(false);

  const [matchedUserId, setMatchedUserId] = useState<number | null>(null);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpAttempt, setOtpAttempt] = useState(0);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const handlePhoneChange = (raw: string) => {
    setPhone(formatPhoneBR(raw));
    if (phoneError) setPhoneError(null);
  };

  const handlePhoneSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (!isValidPhoneBR(phone)) {
      setPhoneError('Informe um telefone válido no formato (XX) XXXXX-XXXX.');
      return;
    }

    const user = users.find((u) => u.phone === phone);
    if (!user) {
      setPhoneError('Telefone não cadastrado no sistema.');
      return;
    }
    if (user.status === 'Inativo') {
      setPhoneError('Este usuário está inativo. Contate o gestor.');
      return;
    }

    setIsSendingCode(true);
    window.setTimeout(() => {
      setIsSendingCode(false);
      setMatchedUserId(user.id);
      setStep('otp');
    }, 500);
  };

  const handleOtpComplete = (code: string) => {
    if (code !== DEMO_OTP_CODE) {
      setOtpError('Código inválido. Tente novamente.');
      setOtp('');
      setOtpAttempt((n) => n + 1);
      return;
    }
    if (matchedUserId !== null) login(matchedUserId);
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setOtp('');
    setOtpError(null);
    setMatchedUserId(null);
  };

  const handleResend = () => {
    setOtp('');
    setOtpError(null);
    setOtpAttempt((n) => n + 1);
    setResendMessage('Código reenviado.');
    window.setTimeout(() => setResendMessage(null), 2500);
  };

  const handleSimulateLogin = (role: 'Gestor' | 'Técnico') => {
    const user = users.find((u) => u.role === role && u.status === 'Ativo');
    if (user) login(user.id);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl sm:p-8">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500">
            <Wrench className="h-6 w-6 text-zinc-950" />
          </div>
          <h1 className="text-lg font-semibold text-zinc-100">CMMS / EAM</h1>
          <p className="text-sm text-zinc-500">Gestão de Ativos & Manutenção</p>
        </div>

        {step === 'phone' ? (
          <form onSubmit={handlePhoneSubmit} noValidate>
            <label htmlFor="phone" className="mb-2 block text-sm font-medium text-zinc-300">
              Número de telefone
            </label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="(11) 98888-0001"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                maxLength={15}
                className="h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 pl-10 pr-3 text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
            </div>
            {phoneError ? (
              <p className="mt-2 text-sm text-red-500">{phoneError}</p>
            ) : (
              <p className="mt-2 text-xs text-zinc-600">
                Demo: (11) 98888-0001 (Gestor) ou (11) 98888-0003 (Técnico)
              </p>
            )}

            <button
              type="submit"
              disabled={isSendingCode}
              className="mt-4 flex h-11 w-full items-center justify-center rounded-lg bg-orange-500 font-medium text-zinc-950 transition-colors hover:bg-orange-400 disabled:opacity-60"
            >
              {isSendingCode ? 'Enviando código...' : 'Enviar código'}
            </button>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-zinc-800" />
              <span className="text-xs text-zinc-600">ou entre direto</span>
              <div className="h-px flex-1 bg-zinc-800" />
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleSimulateLogin('Gestor')}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
              >
                <Briefcase className="h-4 w-4" />
                Entrar como Gestor/Liberador
              </button>
              <button
                type="button"
                onClick={() => handleSimulateLogin('Técnico')}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
              >
                <Wrench className="h-4 w-4" />
                Entrar como Técnico
              </button>
            </div>
          </form>
        ) : (
          <div>
            <button
              type="button"
              onClick={handleBackToPhone}
              className="mb-4 flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Alterar número
            </button>

            <div className="mb-6 flex flex-col items-center text-center">
              <ShieldCheck className="mb-2 h-8 w-8 text-orange-500" />
              <p className="text-sm text-zinc-300">
                Enviamos um código para <span className="font-medium text-zinc-100">{phone}</span>
              </p>
              <p className="mt-1 text-xs text-zinc-600">Código de demonstração: {DEMO_OTP_CODE}</p>
            </div>

            <OtpInput
              key={otpAttempt}
              length={4}
              value={otp}
              onChange={(value) => {
                setOtp(value);
                if (otpError) setOtpError(null);
              }}
              onComplete={handleOtpComplete}
              error={!!otpError}
            />

            <div className="mt-3 min-h-5 text-center">
              {otpError && <p className="text-sm text-red-500">{otpError}</p>}
              {resendMessage && <p className="text-sm text-green-500">{resendMessage}</p>}
            </div>

            <button
              type="button"
              onClick={() => handleOtpComplete(otp)}
              disabled={otp.length !== 4}
              className="mt-4 flex h-11 w-full items-center justify-center rounded-lg bg-orange-500 font-medium text-zinc-950 transition-colors hover:bg-orange-400 disabled:opacity-60"
            >
              Confirmar
            </button>

            <button
              type="button"
              onClick={handleResend}
              className="mt-3 w-full text-center text-sm text-zinc-500 transition-colors hover:text-zinc-300"
            >
              Reenviar código
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
