'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  User,
  Ship,
  Phone,
  Mail,
  MapPin,
  FileText,
  CheckCircle,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Download,
  ArrowLeft,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { admin } from '@/lib/api';
import { createPortal } from 'react-dom';

function docUrl(url: string | undefined | null): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  return url.startsWith('/') ? url : `/${url}`;
}

const isPdf = (url: string | undefined | null) =>
  !!url && url.toLowerCase().endsWith('.pdf');

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

interface PendingCaptain {
  id: string;
  name: string;
  phone: string;
  email: string;
  cpf?: string;
  city?: string;
  state?: string;
  licensePhotoUrl?: string;
  certificatePhotoUrl?: string;
}

interface PendingBoat {
  id: string;
  name: string;
  documentPhotos: string[];
  photos: string[];
  rejectionReason?: string | null;
  owner?: { id: string; name: string; email: string };
}

interface PendingData {
  pendingCaptains: PendingCaptain[];
  pendingBoats: PendingBoat[];
}

type ViewerState = { photos: string[]; labels: string[]; index: number } | null;
type RejectTarget = { type: 'captain' | 'boat'; id: string; name: string } | null;

// ─── Viewer de documento full-screen (z-200) ─────────────────────────────────
function DocumentViewer({
  viewer, onChange, onClose,
}: {
  viewer: NonNullable<ViewerState>;
  onChange: React.Dispatch<React.SetStateAction<ViewerState>>;
  onClose: () => void;
}) {
  const { photos, labels, index } = viewer;
  const total = photos.length;
  const prev = () => onChange(v => v ? { ...v, index: (v.index - 1 + total) % total } : v);
  const next = () => onChange(v => v ? { ...v, index: (v.index + 1) % total } : v);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, index]);

  const currentUrl = docUrl(photos[index]);
  const currentLabel = labels[index] ?? `Foto ${index + 1}`;

  return createPortal(
    <div className="fixed inset-0 z-200 flex flex-col bg-zinc-950">
      <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-3">
          <FileText className="h-4 w-4 text-zinc-400" />
          <span className="text-white font-semibold text-sm">{currentLabel}</span>
          {total > 1 && <span className="text-zinc-500 text-xs bg-zinc-800 px-2 py-0.5 rounded-full">{index + 1} / {total}</span>}
        </div>
        <div className="flex items-center gap-1">
          <a href={currentUrl} download target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors">
            <Download className="h-3.5 w-3.5" /> Baixar
          </a>
          <button onClick={onClose} title="Fechar (Esc)"
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors">
            <X className="h-4 w-4" /> Fechar
          </button>
        </div>
      </div>
      <div className="relative flex flex-1 items-center justify-center bg-zinc-900 overflow-hidden">
        {isPdf(currentUrl) ? (
          <iframe key={currentUrl} src={currentUrl} title={currentLabel} className="w-full h-full border-0" />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img key={currentUrl} src={currentUrl} alt={currentLabel}
            className="max-h-full max-w-full object-contain select-none" />
        )}
        {total > 1 && (
          <>
            <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/90 text-white rounded-full p-3 z-10">
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/90 text-white rounded-full p-3 z-10">
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>
      {total > 1 && (
        <div className="flex gap-2 px-4 py-3 border-t border-zinc-800 overflow-x-auto shrink-0">
          {photos.map((url, i) => (
            <button key={i} onClick={() => onChange(v => v ? { ...v, index: i } : v)}
              className={`shrink-0 relative rounded overflow-hidden border-2 transition-all ${i === index ? 'border-white scale-105' : 'border-transparent opacity-50 hover:opacity-80'}`}>
              {isPdf(url)
                ? <div className="w-16 h-16 flex items-center justify-center bg-zinc-800"><FileText className="h-6 w-6 text-zinc-400" /></div>
                // eslint-disable-next-line @next/next/no-img-element
                : <img src={docUrl(url)} alt={labels[i]} className="w-16 h-16 object-cover" />}
              <span className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[9px] text-center py-0.5 truncate px-0.5">
                {labels[i] ?? `Foto ${i + 1}`}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body
  );
}

// ─── Card de documento individual ────────────────────────────────────────────
function DocCard({ url, label, onClick }: { url: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group text-left rounded-2xl overflow-hidden border bg-card shadow-sm hover:shadow-lg transition-all duration-200 w-full"
      title={`Ampliar: ${label}`}
    >
      {/* Imagem / PDF */}
      <div className="relative bg-zinc-50 dark:bg-zinc-900 overflow-hidden" style={{ minHeight: 240 }}>
        {isPdf(url) ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
              <FileText className="h-8 w-8 text-red-500" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Documento PDF</span>
          </div>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={docUrl(url)}
            alt={label}
            className="w-full object-contain transition-transform duration-300 group-hover:scale-105"
            style={{ minHeight: 240, maxHeight: 360 }}
          />
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-200 flex items-center justify-center">
          <div className="scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-200 bg-white rounded-full p-3 shadow-lg">
            <ZoomIn className="h-6 w-6 text-zinc-800" />
          </div>
        </div>
      </div>
      {/* Label bar */}
      <div className="px-4 py-3 flex items-center gap-2.5 border-t bg-card">
        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="font-semibold text-sm flex-1">{label}</span>
        <ZoomIn className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </button>
  );
}

// ─── Overlay de detalhe (z-50) ────────────────────────────────────────────────
function DetailOverlay({
  avatarColor,
  title,
  subtitle,
  badge,
  info,
  rejectionWarning,
  docSections,
  onClose,
  onApprove,
  onReject,
  isMutating,
  openViewer,
}: {
  avatarColor: string;
  title: string;
  subtitle: string;
  badge: React.ReactNode;
  info: { icon: React.ReactNode; value: string }[];
  rejectionWarning?: string | null;
  docSections: {
    heading: string;
    photos: string[];
    labels: string[];
    offset: number;
    allPhotos: string[];
    allLabels: string[];
  }[];
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  isMutating: boolean;
  openViewer: (photos: string[], labels: string[], index: number) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalDocs = docSections.reduce((s, sec) => s + sec.photos.length, 0);

  return createPortal(
    <div className="fixed inset-0 z-50 bg-background flex flex-col">

      {/* ── Navbar ── */}
      <div className="shrink-0 border-b bg-background/95 backdrop-blur">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center gap-3">
          <button onClick={onClose}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
            <ArrowLeft className="h-4 w-4" />
            Verificações
          </button>
          <span className="text-border text-lg font-light">/</span>
          <span className="font-semibold text-sm truncate">{title}</span>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onReject} disabled={isMutating} size="sm"
              className="text-destructive border-destructive/40 hover:bg-destructive hover:text-destructive-foreground">
              <X className="h-3.5 w-3.5 mr-1.5" /> Rejeitar
            </Button>
            <Button onClick={onApprove} disabled={isMutating} size="sm"
              className="bg-green-600 hover:bg-green-700 text-white">
              <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
              {isMutating ? 'Salvando…' : 'Aprovar'}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto bg-muted/30">
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">

          {/* Profile card */}
          <div className={`rounded-2xl border bg-card shadow-sm overflow-hidden`}>
            <div className="h-2 w-full" style={{ background: avatarColor }} />
            <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-5">
              {/* Avatar */}
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl shrink-0"
                style={{ background: avatarColor }}
              >
                {initials(title)}
              </div>
              {/* Name + badge */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold">{title}</h2>
                  {badge}
                </div>
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              </div>
              {/* Info chips */}
              <div className="flex flex-wrap gap-3 sm:justify-end">
                {info.map((row, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted rounded-lg px-3 py-1.5">
                    <span className="shrink-0">{row.icon}</span>
                    <span className="max-w-45 truncate">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Rejection warning */}
          {rejectionWarning && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4 flex gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-destructive mb-1">Rejeição anterior registrada</p>
                <p className="text-muted-foreground">{rejectionWarning}</p>
              </div>
            </div>
          )}

          {/* Document sections */}
          {docSections.map((section, si) => (
            <section key={si} className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold text-base">{section.heading}</h3>
                <span className="text-sm text-muted-foreground">({section.photos.length})</span>
              </div>

              {section.photos.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-muted-foreground/20 px-8 py-12 text-center">
                  <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground font-medium">Nenhum arquivo enviado</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">O capitão ainda não enviou este documento</p>
                </div>
              ) : (
                <div className={`grid gap-5 ${section.photos.length === 1 ? 'max-w-md' : 'sm:grid-cols-2'}`}>
                  {section.photos.map((url, i) => (
                    <DocCard
                      key={i}
                      url={url}
                      label={section.labels[i]}
                      onClick={() => openViewer(section.allPhotos, section.allLabels, section.offset + i)}
                    />
                  ))}
                </div>
              )}
            </section>
          ))}

          {/* Bottom action bar */}
          {totalDocs > 0 && (
            <div className="rounded-2xl border bg-card shadow-sm px-6 py-4 flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                Revisou todos os {totalDocs} documento{totalDocs > 1 ? 's' : ''}? Tome uma decisão:
              </p>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" onClick={onReject} disabled={isMutating}
                  className="text-destructive border-destructive/40 hover:bg-destructive hover:text-destructive-foreground">
                  <X className="h-4 w-4 mr-1.5" /> Rejeitar
                </Button>
                <Button onClick={onApprove} disabled={isMutating} className="bg-green-600 hover:bg-green-700 text-white">
                  <CheckCircle className="h-4 w-4 mr-1.5" />
                  {isMutating ? 'Salvando…' : 'Aprovar'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function VerificationsPage() {
  const queryClient = useQueryClient();
  const [viewer, setViewer] = useState<ViewerState>(null);
  const [rejectTarget, setRejectTarget] = useState<RejectTarget>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedCaptain, setSelectedCaptain] = useState<PendingCaptain | null>(null);
  const [selectedBoat, setSelectedBoat] = useState<PendingBoat | null>(null);

  const { data, isLoading } = useQuery<PendingData>({
    queryKey: ['pending-verifications'],
    queryFn: () => admin.boats.getPending(),
    staleTime: 0,
  });

  const captainVerifyMutation = useMutation({
    mutationFn: ({ id, verified, rejectionReason }: { id: string; verified: boolean; rejectionReason?: string }) =>
      admin.users.verify(id, verified, rejectionReason),
    onSuccess: (_, { id }) => {
      // Remove imediatamente do cache — o backend pode ainda retornar o item na lista
      queryClient.setQueryData<PendingData>(['pending-verifications'], old =>
        old ? { ...old, pendingCaptains: old.pendingCaptains.filter(c => c.id !== id) } : old
      );
      queryClient.invalidateQueries({ queryKey: ['pending-verifications'] });
      setRejectTarget(null);
      setRejectReason('');
      setSelectedCaptain(null);
    },
  });

  const boatVerifyMutation = useMutation({
    mutationFn: ({ id, approved, reason }: { id: string; approved: boolean; reason?: string }) =>
      admin.boats.verify(id, approved, reason),
    onSuccess: (_, { id }) => {
      // Remove imediatamente do cache
      queryClient.setQueryData<PendingData>(['pending-verifications'], old =>
        old ? { ...old, pendingBoats: old.pendingBoats.filter(b => b.id !== id) } : old
      );
      queryClient.invalidateQueries({ queryKey: ['pending-verifications'] });
      queryClient.invalidateQueries({ queryKey: ['boats'] });
      setRejectTarget(null);
      setRejectReason('');
      setSelectedBoat(null);
    },
  });

  const pendingCaptains = data?.pendingCaptains ?? [];
  const pendingBoats = data?.pendingBoats ?? [];
  const totalPending = pendingCaptains.length + pendingBoats.length;
  const isMutating = captainVerifyMutation.isPending || boatVerifyMutation.isPending;

  const openViewer = (photos: string[], labels: string[], index = 0) =>
    setViewer({ photos, labels, index });

  const handleRejectConfirm = () => {
    if (!rejectTarget) return;
    const { type, id } = rejectTarget;
    if (type === 'captain') captainVerifyMutation.mutate({ id, verified: false, rejectionReason: rejectReason });
    else boatVerifyMutation.mutate({ id, approved: false, reason: rejectReason });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-primary" />
          Verificações Pendentes
        </h1>
        <p className="text-muted-foreground">
          Aprove ou rejeite documentos de capitães e embarcações
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />)}
        </div>
      ) : totalPending === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
            <p className="text-lg font-medium">Nenhuma pendência!</p>
            <p className="text-sm mt-1">Todos os capitães e embarcações foram verificados.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ── Capitães ── */}
          {pendingCaptains.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <User className="h-5 w-5" />
                Capitães Pendentes
                <Badge variant="secondary">{pendingCaptains.length}</Badge>
              </h2>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {pendingCaptains.map(captain => {
                  const docCount = [captain.licensePhotoUrl, captain.certificatePhotoUrl].filter(Boolean).length;
                  return (
                    <Card
                      key={captain.id}
                      className="cursor-pointer hover:shadow-md transition-all group overflow-hidden border-0 shadow-sm"
                      onClick={() => setSelectedCaptain(captain)}
                    >
                      <div className="h-1.5 w-full bg-amber-400" />
                      <CardContent className="pt-4 pb-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 text-amber-700 font-bold text-sm">
                              {initials(captain.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-sm truncate">{captain.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{captain.email}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-amber-700 border-amber-300 shrink-0 text-xs">
                            Pendente
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {[captain.city, captain.state].filter(Boolean).join(', ') || 'Local não informado'}
                          </span>
                          <span className="text-primary font-medium group-hover:underline">
                            {docCount} doc{docCount !== 1 ? 's' : ''} · Ver →
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Embarcações ── */}
          {pendingBoats.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Ship className="h-5 w-5" />
                Embarcações Pendentes
                <Badge variant="secondary">{pendingBoats.length}</Badge>
              </h2>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {pendingBoats.map(boat => {
                  const total = (boat.documentPhotos?.length ?? 0) + (boat.photos?.length ?? 0);
                  return (
                    <Card
                      key={boat.id}
                      className="cursor-pointer hover:shadow-md transition-all group overflow-hidden border-0 shadow-sm"
                      onClick={() => setSelectedBoat(boat)}
                    >
                      <div className={`h-1.5 w-full ${boat.rejectionReason ? 'bg-destructive' : 'bg-blue-400'}`} />
                      <CardContent className="pt-4 pb-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                              <Ship className="h-4 w-4 text-blue-700" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-sm truncate">{boat.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{boat.owner?.name ?? '—'}</p>
                            </div>
                          </div>
                          {boat.rejectionReason
                            ? <Badge variant="destructive" className="shrink-0 text-xs">Rejeitado</Badge>
                            : <Badge variant="outline" className="text-amber-700 border-amber-300 shrink-0 text-xs">Pendente</Badge>}
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span className="truncate max-w-37.5">{boat.owner?.email ?? '—'}</span>
                          </span>
                          <span className="text-primary font-medium group-hover:underline">
                            {total} foto{total !== 1 ? 's' : ''} · Ver →
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}

      {/* ── Overlay capitão ── */}
      {selectedCaptain && (() => {
        const photos = [
          ...(selectedCaptain.licensePhotoUrl ? [selectedCaptain.licensePhotoUrl] : []),
          ...(selectedCaptain.certificatePhotoUrl ? [selectedCaptain.certificatePhotoUrl] : []),
        ];
        const labels = [
          ...(selectedCaptain.licensePhotoUrl ? ['Habilitação Náutica'] : []),
          ...(selectedCaptain.certificatePhotoUrl ? ['Certificado'] : []),
        ];
        return (
          <DetailOverlay
            avatarColor="#f59e0b"
            title={selectedCaptain.name}
            subtitle="Capitão pendente de verificação de documentos"
            badge={<Badge variant="outline" className="text-amber-700 border-amber-400">Pendente</Badge>}
            info={[
              { icon: <Mail className="h-3.5 w-3.5" />, value: selectedCaptain.email },
              { icon: <Phone className="h-3.5 w-3.5" />, value: selectedCaptain.phone },
              ...(selectedCaptain.cpf ? [{ icon: <FileText className="h-3.5 w-3.5" />, value: `CPF: ${selectedCaptain.cpf}` }] : []),
              ...((selectedCaptain.city || selectedCaptain.state)
                ? [{ icon: <MapPin className="h-3.5 w-3.5" />, value: [selectedCaptain.city, selectedCaptain.state].filter(Boolean).join(', ') }]
                : []),
            ]}
            docSections={[{ heading: 'Documentos', photos, labels, offset: 0, allPhotos: photos, allLabels: labels }]}
            onClose={() => setSelectedCaptain(null)}
            onApprove={() => captainVerifyMutation.mutate({ id: selectedCaptain.id, verified: true })}
            onReject={() => { setRejectTarget({ type: 'captain', id: selectedCaptain.id, name: selectedCaptain.name }); setRejectReason(''); }}
            isMutating={isMutating}
            openViewer={openViewer}
          />
        );
      })()}

      {/* ── Overlay embarcação ── */}
      {selectedBoat && (() => {
        const docPhotos = selectedBoat.documentPhotos ?? [];
        const boatPhotos = selectedBoat.photos ?? [];
        const allPhotos = [...docPhotos, ...boatPhotos];
        const allLabels = [
          ...docPhotos.map((_, i) => `Documento ${i + 1}`),
          ...boatPhotos.map((_, i) => `Foto ${i + 1}`),
        ];
        return (
          <DetailOverlay
            avatarColor="#3b82f6"
            title={selectedBoat.name}
            subtitle={selectedBoat.owner ? `Proprietário: ${selectedBoat.owner.name}` : 'Embarcação pendente de verificação'}
            badge={selectedBoat.rejectionReason
              ? <Badge variant="destructive" className="text-xs">Rejeitado antes</Badge>
              : <Badge variant="outline" className="text-amber-700 border-amber-400">Pendente</Badge>}
            info={[
              ...(selectedBoat.owner ? [
                { icon: <User className="h-3.5 w-3.5" />, value: selectedBoat.owner.name },
                { icon: <Mail className="h-3.5 w-3.5" />, value: selectedBoat.owner.email },
              ] : []),
            ]}
            rejectionWarning={selectedBoat.rejectionReason}
            docSections={[
              { heading: 'Documentos', photos: docPhotos, labels: docPhotos.map((_, i) => `Documento ${i + 1}`), offset: 0, allPhotos, allLabels },
              { heading: 'Fotos da Embarcação', photos: boatPhotos, labels: boatPhotos.map((_, i) => `Foto ${i + 1}`), offset: docPhotos.length, allPhotos, allLabels },
            ]}
            onClose={() => setSelectedBoat(null)}
            onApprove={() => boatVerifyMutation.mutate({ id: selectedBoat.id, approved: true })}
            onReject={() => { setRejectTarget({ type: 'boat', id: selectedBoat.id, name: selectedBoat.name }); setRejectReason(''); }}
            isMutating={isMutating}
            openViewer={openViewer}
          />
        );
      })()}

      {/* Viewer full-screen */}
      {viewer && <DocumentViewer viewer={viewer} onChange={setViewer} onClose={() => setViewer(null)} />}

      {/* Dialog de rejeição */}
      <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar {rejectTarget?.type === 'captain' ? 'Capitão' : 'Embarcação'}</DialogTitle>
            <DialogDescription>
              O motivo será enviado por notificação push para <strong>{rejectTarget?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="reject-reason">Motivo *</Label>
            <Textarea
              id="reject-reason"
              placeholder="Ex: Foto do documento ilegível, por favor reenvie a habilitação náutica com melhor qualidade."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleRejectConfirm} disabled={!rejectReason.trim() || isMutating}>
              {isMutating ? 'Rejeitando...' : 'Confirmar Rejeição'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
