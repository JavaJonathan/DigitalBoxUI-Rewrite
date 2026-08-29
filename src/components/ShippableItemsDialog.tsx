import { Fragment, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import LinearProgress from '@mui/material/LinearProgress';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import CloseIcon from '@mui/icons-material/Close';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { generateShippableItemsReport } from '../api/reports';
import { getApiErrorMessage } from '../api/client';
import { parseCsvHeaders, guessInventoryColumns, toCsv, downloadCsv } from '../lib/csv';
import { Mono } from './ui/Mono';
import { MarketplaceTag } from './ui/MarketplaceTag';
import { FileDropzone } from './ui/FileDropzone';
import type { ShippableItemsResponse, ShippableCoverage, ShippableOrderStatus } from '../types';

interface ShippableItemsDialogProps {
  open: boolean;
  onClose: () => void;
}

type Phase = 'pick' | 'map' | 'done';
type ResultTab = 'orders' | 'items' | 'unmatched';

const COVERAGE_COLOR: Record<ShippableCoverage, 'success' | 'warning' | 'error'> = {
  Covered: 'success',
  Partial: 'warning',
  Blocked: 'error',
};

const ORDER_STATUS: Record<
  ShippableOrderStatus,
  { label: string; color: 'success' | 'warning' | 'error' | 'default' }
> = {
  Shippable: { label: 'Shippable', color: 'success' },
  Partial: { label: 'Partial', color: 'warning' },
  Blocked: { label: 'Blocked', color: 'error' },
  NeedsCheck: { label: 'Needs check', color: 'default' },
};

const stamp = () => new Date().toISOString().slice(0, 10);

export function ShippableItemsDialog({ open, onClose }: ShippableItemsDialogProps) {
  const [phase, setPhase] = useState<Phase>('pick');
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState({ sku: '', title: '', qty: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ShippableItemsResponse | null>(null);
  const [tab, setTab] = useState<ResultTab>('orders');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const reset = () => {
    setPhase('pick');
    setFile(null);
    setHeaders([]);
    setMapping({ sku: '', title: '', qty: '' });
    setError(null);
    setResult(null);
    setTab('orders');
    setExpanded(new Set());
  };

  const close = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const accept = async (f: File | undefined) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.csv')) {
      setError('Choose a .csv file.');
      return;
    }
    setError(null);
    setFile(f);
    const head = await f.slice(0, 64 * 1024).text();
    const cols = parseCsvHeaders(head);
    if (cols.length === 0) {
      setError('That file has no header row.');
      return;
    }
    setHeaders(cols);
    const guess = guessInventoryColumns(cols);
    setMapping({ sku: guess.sku, title: guess.title, qty: guess.qty });
    setPhase('map');
  };

  const generate = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const res = await generateShippableItemsReport(file, {
        skuColumn: mapping.sku,
        titleColumn: mapping.title,
        qtyColumn: mapping.qty,
      });
      setResult(res);
      setTab('orders');
      setExpanded(new Set());
      setPhase('done');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not generate the report.'));
    } finally {
      setBusy(false);
    }
  };

  const toggleOrder = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const download = () => {
    if (!result) return;
    if (tab === 'orders') {
      downloadCsv(
        `DigitalBoxShippableItems-by-order-${stamp()}.csv`,
        toCsv(
          result.orders.map((o) => ({
            order_number: o.orderNumber,
            marketplace: o.marketplace,
            priority: o.isPriority ? 'yes' : 'no',
            status: ORDER_STATUS[o.status].label,
            covered_lines: o.coveredLineCount,
            line_count: o.lineCount,
            short_items: o.shortLines
              .map((s) => `${s.sku ?? s.title} (have ${s.availableQty}/${s.orderedQty})`)
              .join('; '),
          })),
          [
            { key: 'order_number', header: 'order_number' },
            { key: 'marketplace', header: 'marketplace' },
            { key: 'priority', header: 'priority' },
            { key: 'status', header: 'status' },
            { key: 'covered_lines', header: 'covered_lines' },
            { key: 'line_count', header: 'line_count' },
            { key: 'short_items', header: 'short_items' },
          ],
        ),
      );
    } else if (tab === 'items') {
      downloadCsv(
        `DigitalBoxShippableItems-by-item-${stamp()}.csv`,
        toCsv(result.rows, [
          { key: 'title', header: 'title' },
          { key: 'sku', header: 'sku' },
          { key: 'orderedQty', header: 'ordered_qty' },
          { key: 'onHandQty', header: 'on_hand_qty' },
          { key: 'shippableQty', header: 'shippable_qty' },
          { key: 'shortQty', header: 'short_qty' },
          { key: 'coverage', header: 'coverage' },
        ]),
      );
    } else {
      downloadCsv(
        `DigitalBoxShippableItems-not-in-inventory-${stamp()}.csv`,
        toCsv(
          result.unmatchedDemand.map((u) => ({
            title: u.title,
            sku: u.sku ?? '',
            ordered_qty: u.orderedQty,
            order_count: u.orderCount,
          })),
          [
            { key: 'title', header: 'title' },
            { key: 'sku', header: 'sku' },
            { key: 'ordered_qty', header: 'ordered_qty' },
            { key: 'order_count', header: 'order_count' },
          ],
        ),
      );
    }
  };

  const mapField = (label: string, value: string, onChange: (v: string) => void) => (
    <TextField
      select
      size="small"
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      fullWidth
    >
      {headers.map((h) => (
        <MenuItem key={h} value={h}>
          {h}
        </MenuItem>
      ))}
    </TextField>
  );

  const downloadLabel =
    tab === 'orders'
      ? 'Download order list'
      : tab === 'items'
        ? 'Download item list'
        : 'Download list';
  const downloadDisabled =
    !result ||
    (tab === 'orders' && result.orders.length === 0) ||
    (tab === 'items' && result.rows.length === 0) ||
    (tab === 'unmatched' && result.unmatchedDemand.length === 0);

  return (
    <Dialog open={open} onClose={close} maxWidth={phase === 'done' ? 'md' : 'sm'} fullWidth>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
        <DialogTitle>Shippable items report</DialogTitle>
        <IconButton size="small" onClick={close} disabled={busy} aria-label="Close">
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      <DialogContent>
        {phase === 'pick' && (
          <>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
              Upload an inventory-count CSV. DigitalBox cross-references it against open orders and
              tells you which orders you can pack now, what's short, and what demand it couldn't
              find in your file.
            </Typography>
            <FileDropzone
              accept=".csv,text/csv"
              disabled={busy}
              onFiles={(list) => accept(list[0])}
            >
              <UploadFileOutlinedIcon sx={{ fontSize: 32, color: 'text.secondary' }} />
              <Typography sx={{ fontSize: '0.875rem', fontWeight: 550, mt: 1 }}>
                Drop a .csv here, or click to choose
              </Typography>
            </FileDropzone>
          </>
        )}

        {phase === 'map' && (
          <>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              Match the columns from <strong>{file?.name}</strong>.
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {mapField('SKU column', mapping.sku, (v) => setMapping((m) => ({ ...m, sku: v })))}
              {mapField('Product title column', mapping.title, (v) =>
                setMapping((m) => ({ ...m, title: v })),
              )}
              {mapField('On-hand quantity column', mapping.qty, (v) =>
                setMapping((m) => ({ ...m, qty: v })),
              )}
            </Box>
            {busy && <LinearProgress sx={{ mt: 2 }} />}
          </>
        )}

        {phase === 'done' && result && (
          <>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1.5 }}>
              <Chip
                size="small"
                color="success"
                label={`${result.ordersShippable} shippable now`}
              />
              <Chip size="small" color="warning" label={`${result.ordersPartial} partial`} />
              <Chip size="small" color="error" label={`${result.ordersBlocked} blocked`} />
              {result.ordersNeedsCheck > 0 && (
                <Chip size="small" label={`${result.ordersNeedsCheck} needs check`} />
              )}
              <Box sx={{ flex: 1 }} />
              <Typography variant="caption" sx={{ color: 'text.secondary', alignSelf: 'center' }}>
                {result.unitsShippable} units shippable · {result.matchedRowCount} of{' '}
                {result.csvRowCount} inventory rows matched · {result.openOrderCount} open orders
              </Typography>
            </Box>

            <Tabs
              value={tab}
              onChange={(_, v: ResultTab) => setTab(v)}
              sx={{ mb: 1.5, minHeight: 36, '& .MuiTab-root': { minHeight: 36, py: 0 } }}
            >
              <Tab value="orders" label={`By order (${result.orders.length})`} />
              <Tab value="items" label={`By item (${result.rows.length})`} />
              <Tab
                value="unmatched"
                label={`Not in inventory (${result.unmatchedDemand.length})`}
              />
            </Tabs>

            {tab === 'orders' && (
              <TableContainer
                sx={{
                  border: (t) => `1px solid ${(t.vars ?? t).palette.surface.border}`,
                  borderRadius: 2,
                  maxHeight: 360,
                }}
              >
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: 32 }} />
                      <TableCell>Order</TableCell>
                      <TableCell>Marketplace</TableCell>
                      <TableCell align="right">Lines covered</TableCell>
                      <TableCell align="right">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {result.orders.map((o) => {
                      const isOpen = expanded.has(o.orderId);
                      const canExpand = o.shortLines.length > 0;
                      return (
                        <Fragment key={o.orderId}>
                          <TableRow
                            hover={canExpand}
                            onClick={canExpand ? () => toggleOrder(o.orderId) : undefined}
                            sx={{ cursor: canExpand ? 'pointer' : 'default' }}
                          >
                            <TableCell sx={{ px: 0.5 }}>
                              {canExpand && (
                                <KeyboardArrowRightIcon
                                  sx={{
                                    fontSize: 18,
                                    color: 'text.secondary',
                                    transition: 'transform 120ms ease',
                                    transform: isOpen ? 'rotate(90deg)' : 'none',
                                  }}
                                />
                              )}
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                <Mono sx={{ fontSize: '0.8125rem' }}>{o.orderNumber || '—'}</Mono>
                                {o.isPriority && (
                                  <Chip
                                    size="small"
                                    color="warning"
                                    variant="outlined"
                                    label="Priority"
                                    sx={{
                                      height: 18,
                                      '& .MuiChip-label': { px: 0.75, fontSize: '0.625rem' },
                                    }}
                                  />
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <MarketplaceTag marketplace={o.marketplace} />
                            </TableCell>
                            <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                              {o.coveredLineCount}/{o.lineCount}
                            </TableCell>
                            <TableCell align="right">
                              <Chip
                                size="small"
                                color={ORDER_STATUS[o.status].color}
                                label={ORDER_STATUS[o.status].label}
                              />
                            </TableCell>
                          </TableRow>
                          {canExpand && (
                            <TableRow>
                              <TableCell sx={{ py: 0, border: 0 }} colSpan={5}>
                                <Collapse in={isOpen} unmountOnExit>
                                  <Box sx={{ py: 1, pl: 4 }}>
                                    {o.shortLines.map((s, i) => (
                                      <Box
                                        key={`${s.sku ?? s.title}-${i}`}
                                        sx={{
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          gap: 2,
                                          fontSize: '0.75rem',
                                          py: 0.25,
                                        }}
                                      >
                                        <Typography sx={{ fontSize: '0.75rem' }} noWrap>
                                          {s.title}
                                          {s.sku ? (
                                            <Mono muted sx={{ fontSize: '0.6875rem', ml: 1 }}>
                                              {s.sku}
                                            </Mono>
                                          ) : null}
                                        </Typography>
                                        <Typography
                                          sx={{
                                            fontSize: '0.75rem',
                                            color: 'error.main',
                                            whiteSpace: 'nowrap',
                                            fontVariantNumeric: 'tabular-nums',
                                          }}
                                        >
                                          have {s.availableQty} / need {s.orderedQty}
                                        </Typography>
                                      </Box>
                                    ))}
                                  </Box>
                                </Collapse>
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {tab === 'items' && (
              <>
                <TableContainer
                  sx={{
                    border: (t) => `1px solid ${(t.vars ?? t).palette.surface.border}`,
                    borderRadius: 2,
                    maxHeight: 360,
                  }}
                >
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Item</TableCell>
                        <TableCell align="right">Ordered</TableCell>
                        <TableCell align="right">On hand</TableCell>
                        <TableCell align="right">Shippable</TableCell>
                        <TableCell align="right">Short</TableCell>
                        <TableCell align="right">Coverage</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {result.rows.slice(0, 100).map((r, i) => (
                        <TableRow key={`${r.sku}-${i}`}>
                          <TableCell sx={{ maxWidth: 260 }}>
                            <Typography sx={{ fontSize: '0.8125rem' }} noWrap>
                              {r.title}
                            </Typography>
                            <Mono muted sx={{ fontSize: '0.6875rem' }}>
                              {r.sku}
                            </Mono>
                          </TableCell>
                          <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                            {r.orderedQty}
                          </TableCell>
                          <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                            {r.onHandQty}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              fontVariantNumeric: 'tabular-nums',
                              fontWeight: 650,
                              color: r.shippableQty > 0 ? 'success.main' : 'text.disabled',
                            }}
                          >
                            {r.shippableQty}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              fontVariantNumeric: 'tabular-nums',
                              color: r.shortQty > 0 ? 'error.main' : 'text.disabled',
                            }}
                          >
                            {r.shortQty}
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              size="small"
                              color={COVERAGE_COLOR[r.coverage]}
                              label={r.coverage}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {result.rows.length > 100 && (
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.disabled', mt: 1, display: 'block' }}
                  >
                    Showing the first 100 rows — the download has all {result.rows.length}.
                  </Typography>
                )}
              </>
            )}

            {tab === 'unmatched' && (
              <>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
                  Open-order demand with no matching row in your upload — out of stock, a SKU
                  mismatch, or a variant SKU the report skips.
                </Typography>
                {result.unmatchedDemand.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                    Every open-order line matched an inventory row.
                  </Typography>
                ) : (
                  <TableContainer
                    sx={{
                      border: (t) => `1px solid ${(t.vars ?? t).palette.surface.border}`,
                      borderRadius: 2,
                      maxHeight: 320,
                    }}
                  >
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Item</TableCell>
                          <TableCell align="right">Ordered</TableCell>
                          <TableCell align="right">Orders</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {result.unmatchedDemand.slice(0, 200).map((u, i) => (
                          <TableRow key={`${u.sku ?? u.title}-${i}`}>
                            <TableCell sx={{ maxWidth: 320 }}>
                              <Typography sx={{ fontSize: '0.8125rem' }} noWrap>
                                {u.title || '—'}
                              </Typography>
                              {u.sku && (
                                <Mono muted sx={{ fontSize: '0.6875rem' }}>
                                  {u.sku}
                                </Mono>
                              )}
                            </TableCell>
                            <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                              {u.orderedQty}
                            </TableCell>
                            <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                              {u.orderCount}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </>
            )}
          </>
        )}

        {error && (
          <Typography sx={{ mt: 2, fontSize: '0.8125rem', color: 'error.main' }}>
            {error}
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        {phase === 'done' ? (
          <>
            <Button variant="text" onClick={reset}>
              Start over
            </Button>
            <Button variant="contained" onClick={download} disabled={downloadDisabled}>
              {downloadLabel}
            </Button>
          </>
        ) : (
          <>
            <Button variant="text" onClick={close} disabled={busy}>
              Cancel
            </Button>
            {phase === 'map' && (
              <Button
                variant="contained"
                onClick={generate}
                disabled={busy || !mapping.sku || !mapping.title || !mapping.qty}
              >
                Generate
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
