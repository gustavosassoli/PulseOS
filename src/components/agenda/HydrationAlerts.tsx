import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Droplets,
  Bell,
  Clock,
  Plus,
  Trash2,
  Check,
  Play,
  Sliders,
  GlassWater,
  Target,
  MessageSquare,
  AlertCircle,
  BellOff,
  RotateCcw
} from 'lucide-react';
import { auth } from '../../firebase';
import { HydrationSettings } from '../../types';
import {
  DEFAULT_HYDRATION_SETTINGS,
  subscribeToHydrationSettings,
  saveHydrationSettings,
  requestNotificationPermission,
  sendTestNotification
} from '../../services/hydrationService';
import { useLifeScoreStore } from '../../stores/useLifeScoreStore';

export default function HydrationAlerts() {
  const [settings, setSettings] = useState<HydrationSettings>(DEFAULT_HYDRATION_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newTimeInput, setNewTimeInput] = useState('14:00');
  const [showAddTimeModal, setShowAddTimeModal] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  useEffect(() => {
    if ('Notification' in window) {
      setPermissionGranted(Notification.permission === 'granted');
    }
  }, []);

  useEffect(() => {
    if (auth.currentUser) {
      const unsub = subscribeToHydrationSettings(auth.currentUser.uid, (data) => {
        setSettings(data);
        setLoading(false);
      });
      return () => unsub();
    } else {
      setLoading(false);
    }
  }, []);

  const handleEnablePermissions = async () => {
    const granted = await requestNotificationPermission();
    setPermissionGranted(granted);
    if (granted) {
      useLifeScoreStore.getState().showToast('Notificações ativadas no navegador! 🔔', 'Bell', 0);
    } else {
      useLifeScoreStore.getState().showToast('Permissão de notificação recusada pelo navegador.', 'AlertCircle', 0);
    }
  };

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setSaving(true);
    try {
      await saveHydrationSettings(auth.currentUser.uid, settings);
      useLifeScoreStore.getState().showToast('Alertas de hidratação salvos! 💧', 'Check', 0);
    } catch (err) {
      console.error(err);
      useLifeScoreStore.getState().showToast('Erro ao salvar configurações.', 'AlertCircle', 0);
    } finally {
      setSaving(false);
    }
  };

  const handleAddFixedTime = () => {
    if (!newTimeInput) return;
    if (settings.fixedTimes.includes(newTimeInput)) {
      useLifeScoreStore.getState().showToast('Este horário já existe!', 'AlertCircle', 0);
      return;
    }
    const updated = [...settings.fixedTimes, newTimeInput].sort();
    setSettings((prev) => ({ ...prev, fixedTimes: updated }));
    setShowAddTimeModal(false);
  };

  const handleRemoveFixedTime = (timeToRemove: string) => {
    if (settings.fixedTimes.length <= 1) {
      useLifeScoreStore.getState().showToast('Mantenha pelo menos um horário.', 'AlertCircle', 0);
      return;
    }
    setSettings((prev) => ({
      ...prev,
      fixedTimes: prev.fixedTimes.filter((t) => t !== timeToRemove),
    }));
  };

  const getScheduledTimes = (): string[] => {
    if (settings.mode === 'fixed') {
      return [...settings.fixedTimes].sort();
    } else {
      const times: string[] = [];
      const [startH, startM] = settings.intervalStart.split(':').map(Number);
      const [endH, endM] = settings.intervalEnd.split(':').map(Number);
      
      let currentMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      const stepMinutes = Math.round(settings.intervalHours * 60);

      while (currentMinutes <= endMinutes && times.length < 24) {
        const h = Math.floor(currentMinutes / 60);
        const m = currentMinutes % 60;
        const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        times.push(timeStr);
        currentMinutes += stepMinutes;
      }
      return times;
    }
  };

  const scheduledTimes = getScheduledTimes();
  const estimatedDailyTotal = scheduledTimes.length * settings.containerVolumeMl;
  const targetPercentage = Math.min(Math.round((estimatedDailyTotal / settings.dailyGoalMl) * 100), 100);

  const formatNotificationMessage = (msg: string) => {
    return msg
      .replace('{volume}', `${settings.containerVolumeMl}`)
      .replace('{meta}', `${settings.dailyGoalMl}`);
  };

  const previewText = formatNotificationMessage(settings.customMessage);

  const handleTestNotification = async () => {
    let hasPerm = permissionGranted;
    if (!hasPerm) {
      hasPerm = await requestNotificationPermission();
      setPermissionGranted(hasPerm);
    }

    if (hasPerm) {
      sendTestNotification('Lembrete de Hidratação 💧', previewText);
    }

    useLifeScoreStore.getState().showToast(`Notificação enviada: "${previewText}"`, 'Droplets', 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-on-surface-variant">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-container mr-3"></div>
        <span className="text-xs font-medium">Carregando configurações...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Status Header */}
      <div className="bg-surface-container-low p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-primary-container shrink-0">
            <Droplets className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-label text-[10px] font-bold uppercase tracking-widest text-primary-container">
                HIDRATAÇÃO
              </span>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight mt-0.5">Alertas de Água</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">Configure horários e metas para manter a ingestão regular de líquidos.</p>
          </div>
        </div>

        {/* Status Switcher */}
        <div className="flex items-center gap-3 bg-surface-container-lowest px-4 py-3 rounded-xl border border-white/5 justify-between sm:justify-start">
          <div className="flex items-center gap-2">
            {settings.enabled ? (
              <Bell className="w-4 h-4 text-primary-container" />
            ) : (
              <BellOff className="w-4 h-4 text-on-surface-variant" />
            )}
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              {settings.enabled ? 'Notificações Ativas' : 'Notificações Pausadas'}
            </span>
          </div>

          <button
            onClick={() => setSettings((prev) => ({ ...prev, enabled: !prev.enabled }))}
            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
              settings.enabled ? 'bg-primary-container' : 'bg-surface-container-high'
            }`}
          >
            <motion.div
              className="w-5 h-5 rounded-full bg-[#131313] absolute top-0.5"
              initial={false}
              animate={{ left: settings.enabled ? 'calc(100% - 22px)' : '2px' }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </button>
        </div>
      </div>

      {/* Permission Warning if muted */}
      {permissionGranted === false && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-200">
          <div className="flex items-center gap-2 text-xs font-medium">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Permissão de notificação desativada no seu navegador.</span>
          </div>
          <button
            onClick={handleEnablePermissions}
            className="px-3 py-1.5 bg-amber-400 text-black text-xs font-bold rounded-lg hover:bg-amber-300 transition-colors uppercase tracking-wider cursor-pointer"
          >
            Ativar
          </button>
        </div>
      )}

      {/* Main Controls Section */}
      <div className={`space-y-6 transition-all ${!settings.enabled ? 'opacity-40 pointer-events-none' : ''}`}>
        
        {/* Goals Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Daily Goal */}
          <div className="bg-surface-container-low p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                <Target className="w-4 h-4 text-primary-container" />
                Meta Diária
              </span>
              <span className="text-lg font-black text-primary-container">{settings.dailyGoalMl} ml</span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[2000, 2500, 3000, 3500].map((goal) => (
                <button
                  key={goal}
                  onClick={() => setSettings((prev) => ({ ...prev, dailyGoalMl: goal }))}
                  className={`py-2 px-2 rounded-lg text-xs font-bold transition-all ${
                    settings.dailyGoalMl === goal
                      ? 'bg-primary-container text-[#00210C]'
                      : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  {(goal / 1000).toFixed(1)} L
                </button>
              ))}
            </div>

            <div className="pt-1 flex items-center gap-2">
              <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Personalizado:</span>
              <input
                type="number"
                step="100"
                value={settings.dailyGoalMl}
                onChange={(e) => setSettings((prev) => ({ ...prev, dailyGoalMl: Number(e.target.value) || 2000 }))}
                className="w-28 bg-surface-container-lowest border border-white/10 rounded-lg py-1 px-3 text-white text-xs font-mono font-bold outline-none focus:border-primary-container"
              />
              <span className="text-xs text-on-surface-variant font-medium">ml</span>
            </div>
          </div>

          {/* Volume per Notification */}
          <div className="bg-surface-container-low p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                <GlassWater className="w-4 h-4 text-primary-container" />
                Dose por Lembrete
              </span>
              <span className="text-lg font-black text-primary-container">{settings.containerVolumeMl} ml</span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[200, 250, 300, 500].map((vol) => (
                <button
                  key={vol}
                  onClick={() => setSettings((prev) => ({ ...prev, containerVolumeMl: vol }))}
                  className={`py-2 px-2 rounded-lg text-xs font-bold transition-all ${
                    settings.containerVolumeMl === vol
                      ? 'bg-primary-container text-[#00210C]'
                      : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  {vol} ml
                </button>
              ))}
            </div>

            <div className="pt-1 flex items-center gap-2">
              <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Personalizado:</span>
              <input
                type="number"
                step="50"
                value={settings.containerVolumeMl}
                onChange={(e) => setSettings((prev) => ({ ...prev, containerVolumeMl: Number(e.target.value) || 250 }))}
                className="w-28 bg-surface-container-lowest border border-white/10 rounded-lg py-1 px-3 text-white text-xs font-mono font-bold outline-none focus:border-primary-container"
              />
              <span className="text-xs text-on-surface-variant font-medium">ml</span>
            </div>
          </div>

        </div>

        {/* Schedule & Timing Card */}
        <div className="bg-surface-container-low p-5 rounded-2xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary-container" />
                Frequência e Horários
              </h3>
              <p className="text-xs text-on-surface-variant">Defina os horários em que os lembretes serão emitidos.</p>
            </div>

            {/* Mode Switcher */}
            <div className="flex p-1 bg-surface-container-lowest rounded-xl border border-white/5">
              <button
                onClick={() => setSettings((prev) => ({ ...prev, mode: 'fixed' }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  settings.mode === 'fixed'
                    ? 'bg-surface-container-high text-primary-container'
                    : 'text-on-surface-variant hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Horários Fixos
              </button>
              <button
                onClick={() => setSettings((prev) => ({ ...prev, mode: 'interval' }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  settings.mode === 'interval'
                    ? 'bg-surface-container-high text-primary-container'
                    : 'text-on-surface-variant hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                Intervalo
              </button>
            </div>
          </div>

          {/* Mode Fixed */}
          {settings.mode === 'fixed' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Horários Programados ({settings.fixedTimes.length})
                </span>
                <button
                  onClick={() => setShowAddTimeModal(true)}
                  className="px-2.5 py-1 bg-surface-container-high hover:bg-surface-container-highest text-primary-container rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar Horário
                </button>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {settings.fixedTimes.map((time) => (
                  <div
                    key={time}
                    className="bg-surface-container-lowest px-3 py-2 rounded-xl flex items-center justify-between group hover:bg-surface-container-high transition-colors"
                  >
                    <span className="text-xs font-mono font-bold text-white">{time}</span>
                    <button
                      onClick={() => handleRemoveFixedTime(time)}
                      className="text-on-surface-variant hover:text-error transition-colors p-0.5 cursor-pointer"
                      title="Remover"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mode Interval */}
          {settings.mode === 'interval' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-surface-container-lowest p-3 rounded-xl space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block">
                  Intervalo
                </label>
                <select
                  value={settings.intervalHours}
                  onChange={(e) => setSettings((prev) => ({ ...prev, intervalHours: Number(e.target.value) }))}
                  className="w-full bg-surface-container-low border border-white/5 rounded-lg py-1.5 px-2 text-white text-xs font-bold outline-none"
                >
                  <option value={1}>A cada 1 hora</option>
                  <option value={1.5}>A cada 1h30m</option>
                  <option value={2}>A cada 2 horas</option>
                  <option value={3}>A cada 3 horas</option>
                  <option value={4}>A cada 4 horas</option>
                </select>
              </div>

              <div className="bg-surface-container-lowest p-3 rounded-xl space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block">
                  Início
                </label>
                <input
                  type="time"
                  value={settings.intervalStart}
                  onChange={(e) => setSettings((prev) => ({ ...prev, intervalStart: e.target.value }))}
                  className="w-full bg-surface-container-low border border-white/5 rounded-lg py-1 px-2 text-white text-xs font-bold outline-none"
                />
              </div>

              <div className="bg-surface-container-lowest p-3 rounded-xl space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block">
                  Término
                </label>
                <input
                  type="time"
                  value={settings.intervalEnd}
                  onChange={(e) => setSettings((prev) => ({ ...prev, intervalEnd: e.target.value }))}
                  className="w-full bg-surface-container-low border border-white/5 rounded-lg py-1 px-2 text-white text-xs font-bold outline-none"
                />
              </div>
            </div>
          )}

          {/* Summary Indicator */}
          <div className="bg-surface-container-lowest p-3 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <span className="text-on-surface-variant">
              Projeção: <strong className="text-white">{scheduledTimes.length} lembretes</strong> × {settings.containerVolumeMl}ml ={' '}
              <strong className="text-primary-container">{estimatedDailyTotal} ml/dia</strong> ({targetPercentage}% da meta).
            </span>

            <div className="flex flex-wrap gap-1">
              {scheduledTimes.slice(0, 8).map((t) => (
                <span key={t} className="px-2 py-0.5 bg-surface-container-high rounded text-[10px] font-mono text-white">
                  {t}
                </span>
              ))}
              {scheduledTimes.length > 8 && (
                <span className="px-1.5 py-0.5 text-[10px] text-on-surface-variant">+{scheduledTimes.length - 8}</span>
              )}
            </div>
          </div>
        </div>

        {/* Message Settings */}
        <div className="bg-surface-container-low p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary-container" />
              Mensagem de Notificação
            </h3>
            <button
              onClick={() => setSettings((prev) => ({ ...prev, customMessage: DEFAULT_HYDRATION_SETTINGS.customMessage }))}
              className="text-[10px] text-on-surface-variant hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Restaurar padrão
            </button>
          </div>

          <textarea
            rows={2}
            value={settings.customMessage}
            onChange={(e) => setSettings((prev) => ({ ...prev, customMessage: e.target.value }))}
            className="w-full bg-surface-container-lowest border border-white/5 rounded-xl p-3 text-white text-xs outline-none focus:border-primary-container resize-none"
            placeholder="Digite a mensagem do lembrete..."
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-on-surface-variant">
              Exemplo: <em className="text-white font-normal">"{previewText}"</em>
            </span>

            <button
              onClick={handleTestNotification}
              className="px-3 py-1.5 bg-surface-container-high hover:bg-surface-container-highest text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Play className="w-3 h-3 text-primary-container fill-primary-container" />
              Testar Notificação
            </button>
          </div>
        </div>

        {/* Save Footer */}
        <div className="flex items-center justify-end pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto px-8 py-3.5 bg-primary-container text-[#00210C] font-black uppercase tracking-widest text-xs rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#00210C]"></div>
                Salvando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                Salvar Configurações
              </>
            )}
          </button>
        </div>

      </div>

      {/* Add Time Modal */}
      <AnimatePresence>
        {showAddTimeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xs bg-surface-container-low rounded-2xl p-5 border border-white/10 shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary-container" />
                  Novo Horário
                </h3>
                <button
                  onClick={() => setShowAddTimeModal(false)}
                  className="text-on-surface-variant hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div>
                <input
                  type="time"
                  value={newTimeInput}
                  onChange={(e) => setNewTimeInput(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-white/10 rounded-xl py-3 px-4 text-white text-xl font-mono font-bold text-center outline-none focus:border-primary-container"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setShowAddTimeModal(false)}
                  className="flex-1 py-2 bg-surface-container-high text-white font-bold rounded-xl text-xs hover:bg-surface-container-highest"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddFixedTime}
                  className="flex-1 py-2 bg-primary-container text-[#00210C] font-bold rounded-xl text-xs hover:brightness-110"
                >
                  Adicionar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

