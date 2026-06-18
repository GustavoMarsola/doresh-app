import { useState, useEffect } from 'react';
import { MapPin, Pencil, User, CreditCard, Check, Loader2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; 
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { authFetch } from '@/components/auth/utils';
import { cancellationReasons, API_BASE_URL, BEARER_TOKEN, subscriptionPlans } from '@/components/utils.ts';


export const Profile: React.FC = () => {
  const { toast } = useToast();

  const [isEditable, setIsEditable] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // CANCELAMENTO
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedReason, setSelectedReason]     = useState('');
  const [otherReason, setOtherReason]           = useState('');

  // endereço
  const [formData, setFormData] = useState({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zip: ''
  });

  // planos
  const [planLoading, setPlanLoading] = useState(false);
  const [planData, setPlanData] = useState<null | {
    name: string;
    price: number;
    nextBilling: string;
    status: string;
  }>(null);

  const fetchAddress = async () => {
    setIsLoading(true);

    try {
      const response = await authFetch(`${API_BASE_URL}/api/profile/address`);
      if (!response.ok) throw new Error('Erro ao buscar endereço');

      const data = await response.json();

      if (data?.street) {
        setFormData({
          street: data.street || '',
          number: data.number || '',
          complement: data.complement || '',
          neighborhood: data.neighborhood || '',
          city: data.city || '',
          state: data.state || '',
          zip: data.zip || ''
        });
        setIsEditable(false);
      }
    } catch (err: any) {
      console.error('Erro ao carregar endereço:', err);
      toast({
        title: 'Erro ao carregar dados',
        description: err.message || 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isAddressValid = () => {
    const { street, number, city, state, zip, neighborhood } = formData;
    return street && number && city && state && zip && neighborhood;
  };

  const fetchPlan = async () => {
    setPlanLoading(true);
    try {
      const response = await authFetch(`${API_BASE_URL}/subscription/`);
      if (!response.ok) throw new Error('Erro ao buscar assinatura');

      const data = await response.json();
      setPlanData({
        name: data.subscription.plan_name,
        price: data.subscription.plan_price,
        nextBilling: data.subscription.next_billing,
        status: data.subscription.status,
      });
    } catch (err: any) {
      console.error('Erro ao carregar assinatura:', err);
      setPlanData(null);
    } finally {
      setPlanLoading(false);
    }
  };

  useEffect(() => {
    if (!BEARER_TOKEN) return;
    // fetchAddress();
    fetchPlan();
  }, []);

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      const response = await authFetch('/api/profile/address', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'authorization': `Bearer ${BEARER_TOKEN}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Erro ao salvar o endereço.');

      toast({
        title: 'Endereço atualizado!',
        description: 'Seu endereço foi salvo com sucesso.',
      });

      setIsEditable(false);
    } catch (err: any) {
      console.error('Erro ao salvar endereço:', err);
      toast({
        title: 'Erro ao atualizar endereço',
        description: err.message || 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChoosePlan = async (planId: string) => {
    setIsLoading(true);
    try {
      const response = await authFetch(`${import.meta.env.VITE_API_HOST}/subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${BEARER_TOKEN}`,
        },
        body: JSON.stringify(
          { 
            plan_id: planId,
            payment_method: 'CREDIT_CARD',
            payment_gateway_id: import.meta.env.VITE_PAYMENT_GATEWAY_ID 
          }
        ),
      });

      if (!response.ok) throw new Error('Erro ao escolher o plano.');

      toast({
        title: 'Plano escolhido!',
        description: 'Seu plano foi atualizado com sucesso.',
      });

      fetchPlan();
    }
    catch (err: any) {
      console.error('Erro ao escolher plano:', err);
      toast({
        title: 'Erro ao escolher plano',
        description: err.message || 'Tente novamente.',
        variant: 'destructive',
      });
    }
    finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!selectedReason) {
      toast({
        title: 'Escolha um motivo',
        description: 'Você precisa selecionar um motivo para cancelar.',
        variant: 'destructive'
      });
      return;
    }

    if (selectedReason === 'Outro' && !otherReason.trim()) {
      toast({
        title: 'Preencha o motivo',
        description: 'Por favor, informe o motivo do cancelamento.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await authFetch(`${import.meta.env.VITE_API_HOST}/subscription/cancel`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${BEARER_TOKEN}`,
        },
        body: JSON.stringify({
          canceling_reason: selectedReason === 'Outro' ? otherReason : selectedReason
        }),
      });

      if (!response.ok) throw new Error('Erro ao cancelar a assinatura.');

      toast({
        title: 'Assinatura cancelada!',
        description: 'Sua assinatura foi cancelada com sucesso.',
      });

      fetchPlan();
      setCancelDialogOpen(false);
      setSelectedReason('');
      setOtherReason('');
    } catch (err: any) {
      console.error('Erro ao cancelar assinatura:', err);
      toast({
        title: 'Erro ao cancelar assinatura',
        description: err.message || 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="dashboard-content p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <User className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Meu Perfil</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">

        {/* Card Endereço */}
          {/* TODO: IMPLEMENTAR PÓS MVP */}

        {/* Card Plano */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Meu Plano</span>
            </CardTitle>
            <CardDescription>
              Gerencie sua assinatura
            </CardDescription>
          </CardHeader>
          <CardContent>
            {planLoading ? (
                // Enquanto carrega a informação
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : planData ? (
                //  Informação do plano encontrada
              <div className="space-y-2">
                <p><strong>Plano Atual:</strong> {planData.name}</p>
                <p><strong>Valor:</strong> R$ {planData.price.toFixed(2).replace('.', ',')}</p>
                <p><strong>Próxima cobrança:</strong> {new Date(planData.nextBilling).toLocaleDateString('pt-BR')}</p>
                <p className="flex items-center gap-1">
                    {planData.status === "ACTIVE" ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-red-500" />
                    )}
                    {planData.status === "ACTIVE" ? "Ativo" : "Inativo"}
                </p>
                <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
              <DialogTrigger asChild>
                <button className="text-red-600 underline text-sm mt-2">Cancelar Plano</button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Motivo do cancelamento</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <RadioGroup onValueChange={setSelectedReason} value={selectedReason}>
                    {cancellationReasons.map(reason => (
                      <div key={reason} className="flex items-center space-x-2">
                        <RadioGroupItem value={reason} id={reason} />
                        <label htmlFor={reason}>{reason}</label>
                      </div>
                    ))}
                  </RadioGroup>
                  {selectedReason === 'Outro' && (
                    <Input
                      placeholder="Digite o motivo"
                      value={otherReason}
                      onChange={(e) => setOtherReason(e.target.value)}
                    />
                  )}
                  <Button
                    onClick={handleCancelSubscription}
                    className="w-full mt-2"
                    disabled={isLoading}
                    variant="destructive"
                  >
                    {isLoading ? 'Cancelando...' : 'Confirmar Cancelamento'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

              </div>
            ) : 
            // Caso não tenha assinatura ainda
            (
              <div className="text-sm text-gray-500 space-y-3">
                <p>Você ainda não possui uma assinatura ativa.</p>
                <Dialog>
  <DialogTrigger asChild>
    <Button className="w-full">Escolher um Plano</Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Escolha seu Plano</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4">
        {subscriptionPlans.map((plan) => (
          <Card 
            key={plan.id} 
            className="p-6 flex flex-col justify-between items-start border-2 border-transparent hover:border-green-500 transition-all duration-300"
          >
            <div className="flex justify-between w-full items-center mb-2">
              <h3 className="font-bold text-lg">{plan.name}</h3>
              {plan.discountTax > 0 && (
                <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                  {plan.discountTax * 100}% OFF
                </span>
              )}
            </div>
            <div className="flex items-baseline mb-4">
              {plan.discountTax > 0 && (
                <p className="text-gray-500 text-sm line-through mr-2">
                  R$ {plan.price.toString().replace('.', ',')}
                </p>
              )}
              <p className="text-xl font-bold text-green-600">
                R$ {plan.netPrice.toFixed(2).toString().replace('.', ',')}
              </p>
            </div>
            <div className="text-sm text-gray-600 mb-4">
                <p>Pagamento único por ciclo de {plan.cycle}</p>
            </div>
            <Button
              onClick={() => handleChoosePlan(plan.id)}
              className="w-full"
            >
              Assinar
            </Button>
          </Card>
        ))}
      </div>
    </DialogContent>
</Dialog>
              </div>
            )
        }
          </CardContent>
        </Card>

      </div>
    </div>
  );
};
