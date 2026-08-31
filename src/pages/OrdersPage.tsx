import { useEffect, useMemo, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { AppShell } from '../components/AppShell';
import { QueueToolbar, type ToolbarState } from '../components/QueueToolbar';
import { OrdersTable } from '../components/OrdersTable';
import { UploadDialog } from '../components/UploadDialog';
import { ShippableItemsDialog } from '../components/ShippableItemsDialog';
import { ConfirmActionDialog } from '../components/ConfirmActionDialog';
import { SelectionBar } from '../components/SelectionBar';
import { SlipFolderField } from '../components/SlipFolderField';
import { NotePopover } from '../components/NotePopover';
import { EmptyState } from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/ui/TableSkeleton';
import { PaginationBar } from '../components/ui/PaginationBar';
import { useAuth } from '../auth/AuthContext';
import { useOrders } from '../hooks/useOrders';
import { cancelOrders, setOrderNotes, setOrderPriority, shipOrders } from '../api/orders';
import { getApiErrorMessage } from '../api/client';
import { useToast } from '../components/ToastProvider';
import { useDownloadSlipsOnShip } from '../hooks/useDownloadSlipsOnShip';
import { useSlipDelivery } from '../hooks/useSlipDelivery';
import { useRealtimeEvent } from '../realtime/RealtimeContext';
import { PAGE_SIZE } from '../lib/constants';
import { buildSlipRefs } from '../lib/slipFolder';
import { toggleInSet } from '../lib/collections';
import type { Marketplace, OrderListItem } from '../types';

export function OrdersPage() {
  const { notify } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const [q, setQ] = useState('');
  const [marketplace, setMarketplace] = useState<Marketplace | ''>('');
  const [priority, setPriority] = useState(false);
  const [sort, setSort] = useState<'shipDate' | 'title'>('shipDate');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [uploadOpen, setUploadOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [action, setAction] = useState<'ship' | 'cancel' | null>(null);
  const [downloadSlips, setDownloadSlips] = useDownloadSlipsOnShip();
  const { folder: slipFolder, busy: slipBusy, deliver: deliverSlips } = useSlipDelivery();
  const [noteTarget, setNoteTarget] = useState<{
    order: OrderListItem;
    anchor: HTMLElement;
  } | null>(null);

  const query = useMemo(
    () => ({ status: 'Open' as const, q, marketplace, priority, sort, page, pageSize }),
    [q, marketplace, priority, sort, page, pageSize],
  );
  const { data, loading, error, refresh } = useOrders(query);

  // A coworker shipped / cancelled / uploaded — re-fetch, coalescing bursts into one call.
  const syncTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useRealtimeEvent('queueChanged', () => {
    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(refresh, 1200);
  });
  useEffect(() => () => clearTimeout(syncTimer.current), []);

  const orders = data?.items ?? [];
  const filtered = q.length > 0 || marketplace !== '' || priority;

  const changePageSize = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const applyToolbar = (next: ToolbarState) => {
    setQ(next.q);
    setMarketplace(next.marketplace);
    setPriority(next.priority);
    setPage(1);
  };

  const toggle = (id: string) => setSelectedIds((prev) => toggleInSet(prev, id));

  const toggleAll = (checked: boolean) =>
    setSelectedIds(checked ? new Set(orders.map((o) => o.id)) : new Set());

  const findOrder = (id: string) => orders.find((o) => o.id === id);

  const runAction = async () => {
    const ids = [...selectedIds];
    const shipping = action === 'ship';
    // Snapshot the slips to grab before the ship refreshes the list out from under us.
    const refs = shipping && downloadSlips ? buildSlipRefs(ids, findOrder) : [];
    try {
      const result = shipping ? await shipOrders(ids) : await cancelOrders(ids);
      notify(result.message, 'success');
      setSelectedIds(new Set());
      setAction(null);
      refresh();
      if (refs.length) await deliverSlips(refs);
    } catch (err) {
      notify(getApiErrorMessage(err, 'Action failed.'), 'error');
    }
  };

  const togglePriority = async (order: OrderListItem) => {
    try {
      await setOrderPriority(order.id, !order.isPriority);
      notify(order.isPriority ? 'Priority removed.' : 'Marked priority.', 'success');
      refresh();
    } catch (err) {
      notify(getApiErrorMessage(err, 'Could not update priority.'), 'error');
    }
  };

  const saveNote = async (notes: string | null) => {
    if (!noteTarget) return;
    try {
      await setOrderNotes(noteTarget.order.id, notes);
      notify('Note saved.', 'success');
      refresh();
    } catch (err) {
      notify(getApiErrorMessage(err, 'Could not save the note.'), 'error');
    }
  };

  return (
    <AppShell
      title="Queue"
      titleMeta={
        <Typography
          component="span"
          sx={{ fontSize: '0.75rem', color: 'text.disabled', fontVariantNumeric: 'tabular-nums' }}
        >
          {data?.total ?? 0} open
        </Typography>
      }
      actions={
        <>
          <Tooltip title="Refresh" arrow>
            <IconButton size="small" onClick={refresh} aria-label="Refresh">
              <RefreshIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Inventory2OutlinedIcon sx={{ fontSize: 16 }} />}
            onClick={() => setReportOpen(true)}
            sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
          >
            Shippable items
          </Button>
          {isAdmin && (
            <Button
              variant="contained"
              size="small"
              startIcon={<UploadFileOutlinedIcon sx={{ fontSize: 16 }} />}
              onClick={() => setUploadOpen(true)}
            >
              Upload slips
            </Button>
          )}
        </>
      }
    >
      <Stack spacing={2}>
        <QueueToolbar
          q={q}
          marketplace={marketplace}
          priority={priority}
          showPriority
          onChange={applyToolbar}
        />

        {error && <Alert severity="error">{error}</Alert>}

        {loading ? (
          <Box
            sx={{
              border: (t) => `1px solid ${(t.vars ?? t).palette.surface.border}`,
              borderRadius: 3,
              bgcolor: 'surface.panel',
            }}
          >
            <TableSkeleton rows={10} columns={6} />
          </Box>
        ) : orders.length === 0 ? (
          <Box
            sx={{
              border: (t) => `1px solid ${(t.vars ?? t).palette.surface.border}`,
              borderRadius: 3,
              bgcolor: 'surface.panel',
            }}
          >
            {filtered ? (
              <EmptyState
                icon={<Inventory2OutlinedIcon />}
                title="No matching orders"
                description="Try a different search term or filter."
                action={
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => applyToolbar({ q: '', marketplace: '', priority: false })}
                  >
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={<UploadFileOutlinedIcon />}
                title="The queue is clear"
                description={
                  isAdmin
                    ? 'Upload packing-slip PDFs and DigitalBox will parse them into orders ready to ship.'
                    : 'New orders appear here once an admin uploads packing slips.'
                }
                action={
                  isAdmin ? (
                    <Button variant="contained" size="small" onClick={() => setUploadOpen(true)}>
                      Upload packing slips
                    </Button>
                  ) : undefined
                }
              />
            )}
          </Box>
        ) : (
          <OrdersTable
            orders={orders}
            status="Open"
            selectable
            selectedIds={selectedIds}
            onToggle={toggle}
            onToggleAll={toggleAll}
            sort={sort}
            onSortChange={setSort}
            onTogglePriority={togglePriority}
            onEditNote={(order, anchor) => setNoteTarget({ order, anchor })}
          />
        )}

        {orders.length > 0 && (
          <PaginationBar
            page={page}
            pageSize={pageSize}
            total={data?.total ?? 0}
            onPageChange={setPage}
            onPageSizeChange={changePageSize}
          />
        )}
      </Stack>

      <SelectionBar count={selectedIds.size} onClear={() => setSelectedIds(new Set())}>
        <Button
          size="large"
          variant="contained"
          color="success"
          startIcon={<LocalShippingOutlinedIcon sx={{ fontSize: 18 }} />}
          onClick={() => setAction('ship')}
        >
          Ship
        </Button>
        <Button
          size="large"
          variant="outlined"
          color="error"
          startIcon={<CancelOutlinedIcon sx={{ fontSize: 18 }} />}
          onClick={() => setAction('cancel')}
          sx={{ color: 'error.main', borderColor: (t) => (t.vars ?? t).palette.error.light }}
        >
          Cancel
        </Button>
        <Button
          size="large"
          variant="text"
          startIcon={<FileDownloadOutlinedIcon sx={{ fontSize: 18 }} />}
          onClick={() => deliverSlips(buildSlipRefs([...selectedIds], findOrder), true)}
          disabled={slipBusy}
        >
          {slipBusy ? 'Preparing…' : 'Download slips'}
        </Button>
      </SelectionBar>

      <UploadDialog open={uploadOpen} onClose={() => setUploadOpen(false)} onUploaded={refresh} />
      <ShippableItemsDialog open={reportOpen} onClose={() => setReportOpen(false)} />

      <ConfirmActionDialog
        open={action !== null}
        intent={action ?? 'ship'}
        count={selectedIds.size}
        onClose={() => setAction(null)}
        onConfirm={runAction}
      >
        {action === 'ship' && (
          <Box sx={{ mt: 1.5 }}>
            <FormControlLabel
              sx={{ display: 'flex' }}
              control={
                <Checkbox
                  size="small"
                  checked={downloadSlips}
                  onChange={(e) => setDownloadSlips(e.target.checked)}
                />
              }
              label={
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Save packing slips after shipping
                </Typography>
              }
            />
            {downloadSlips && (
              <SlipFolderField
                supported={slipFolder.supported}
                name={slipFolder.name}
                onChoose={slipFolder.choose}
                onForget={slipFolder.forget}
              />
            )}
          </Box>
        )}
      </ConfirmActionDialog>

      <NotePopover
        open={noteTarget !== null}
        anchorEl={noteTarget?.anchor ?? null}
        initialNote={noteTarget?.order.notes ?? null}
        orderNumber={noteTarget?.order.orderNumber ?? ''}
        onClose={() => setNoteTarget(null)}
        onSave={saveNote}
      />
    </AppShell>
  );
}
