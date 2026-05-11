// ============================================
// Global Admin Settings — System Limits
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, RefreshCcw, ShieldCheck, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { api } from '@/lib/api';

export default function GlobalSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configs, setConfigs] = useState<{ key: string; value: string; description: string }[]>([]);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/config');
      const data = res.data || [];
      
      // Default values if not present
      const defaultConfigs = [
        { key: 'max_ticket_buttons', value: '5', description: 'Maksymalna liczba przycisków w panelu ticketów' },
        { key: 'max_ticket_selects', value: '5', description: 'Maksymalna liczba opcji w menu rozwijanym' },
      ];

      const merged = defaultConfigs.map(def => {
        const found = data.find((d: any) => d.key === def.key);

        return found ? { ...def, value: found.value, description: found.description || def.description } : def;
      });

      setConfigs(merged);
    } catch (error) {
      toast.error('Nie udało się pobrać ustawień');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.patch('/admin/config', configs);
      toast.success('Ustawienia zostały zapisane');
    } catch (error) {
      toast.error('Błąd podczas zapisywania');
    } finally {
      setSaving(false);
    }
  };

  const updateValue = (key: string, value: string) => {
    setConfigs(prev => prev.map(c => c.key === key ? { ...c, value } : c));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <RefreshCcw className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Settings className="w-8 h-8 text-accent" />
            Ustawienia Globalne
          </h1>
          <p className="text-foreground-secondary mt-1">Zarządzaj limitami i konfiguracją całego systemu.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-accent hover:bg-accent-secondary disabled:opacity-50 text-white rounded-xl font-semibold transition-all shadow-lg shadow-accent/20"
        >
          {saving ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Zapisz Zmiany
        </button>
      </div>

      {/* Info Card */}
      <div className="bg-accent/10 border border-accent/20 rounded-2xl p-5 flex gap-4">
        <ShieldCheck className="w-6 h-6 text-accent flex-shrink-0" />
        <div>
          <h4 className="font-semibold text-accent">Panel Administratora</h4>
          <p className="text-sm text-foreground-secondary mt-1">
            Zmiany wprowadzone tutaj wpływają na wszystkich użytkowników platformy. 
            Uważaj, aby nie ustawić limitów wyższych niż te, które obsługuje Discord (np. max 25 przycisków).
          </p>
        </div>
      </div>

      {/* Settings List */}
      <div className="grid gap-6">
        {configs.map((config) => (
          <motion.div
            key={config.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-background-secondary border border-border rounded-2xl p-6 hover:border-accent/50 transition-colors group"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1">
                <h3 className="text-lg font-bold capitalize">{config.key.replace(/_/g, ' ')}</h3>
                <p className="text-sm text-foreground-secondary mt-1">{config.description}</p>
              </div>

              <div className="flex items-center gap-4 min-w-[200px]">
                <input 
                  type="range" 
                  min="1" 
                  max="25" 
                  value={config.value}
                  onChange={(e) => updateValue(config.key, e.target.value)}
                  className="flex-1 accent-accent"
                />
                <div className="w-12 h-10 flex items-center justify-center bg-background-elevated border border-border rounded-lg font-mono font-bold text-accent">
                  {config.value}
                </div>
              </div>
            </div>

            {parseInt(config.value) > 20 && (
              <div className="mt-4 flex items-center gap-2 text-xs text-amber-500">
                <AlertTriangle className="w-4 h-4" />
                Ustawienie wysokiego limitu może wpłynąć na czytelność paneli.
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
