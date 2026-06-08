import { useState } from 'react';

type PaymentStep = 'NETWORK_SELECTION' | 'PHONE_INPUT' | 'USSD_PUSH' | 'SUCCESS';
type Network = 'Orange' | 'Moov' | null;

interface PaymentConfig {
  amount: number;
  reason: 'unlock_driver' | 'premium_sub' | 'driver_sub';
  targetId?: string; // Driver ID if unlocking
}

export function usePaymentSimulation() {
  const [step, setStep] = useState<PaymentStep>('NETWORK_SELECTION');
  const [network, setNetwork] = useState<Network>(null);
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startPayment = () => {
    setStep('NETWORK_SELECTION');
    setNetwork(null);
    setPhone('');
    setPin('');
    setError(null);
  };

  const selectNetwork = (selected: Network) => {
    setNetwork(selected);
    setStep('PHONE_INPUT');
  };

  const submitPhone = (inputPhone: string) => {
    if (inputPhone.length < 8) {
      setError('Veuillez entrer un numéro valide.');
      return;
    }
    setPhone(inputPhone);
    setError(null);
    setLoading(true);
    
    // Simulate API call delay to trigger USSD Push
    setTimeout(() => {
      setLoading(false);
      setStep('USSD_PUSH');
    }, 1500);
  };

  const submitPin = async (inputPin: string, onValid: () => Promise<void>) => {
    if (inputPin.length < 4) {
      setError('Code PIN invalide. Il doit contenir au moins 4 chiffres.');
      return;
    }
    
    setPin(inputPin);
    setError(null);
    setLoading(true);

    try {
      // Simulate real-world transaction delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Execute the actual Supabase logic (passed via callback)
      await onValid();
      
      setStep('SUCCESS');
    } catch (err: any) {
      setError(err.message || 'La transaction a échoué.');
    } finally {
      setLoading(false);
    }
  };

  return {
    step,
    network,
    phone,
    pin,
    loading,
    error,
    startPayment,
    selectNetwork,
    submitPhone,
    submitPin,
    setPhone,
    setPin,
    setError
  };
}
