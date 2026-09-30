import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Tooltip from '@mui/material/Tooltip';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import { fetchPackingSlipObjectUrl } from '../../api/orders';
import { SLIP_RETENTION_DAYS } from '../../lib/constants';

interface Props {
  orderId: string;
  /** Shipped or cancelled: the retention clock is running. */
  closed: boolean;
  /** The API already purged the PDF (byteSize 0), so don't bother fetching it. */
  expired: boolean;
}

/** The packing-slip viewer (right column of the order detail page). Owns the blob URL. */
export function PackingSlipPanel({ orderId, closed, expired }: Props) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (expired) return;
    let revoked = false;
    let url: string | null = null;
    fetchPackingSlipObjectUrl(orderId)
      .then((objectUrl) => {
        if (revoked) return URL.revokeObjectURL(objectUrl);
        url = objectUrl;
        setPdfUrl(objectUrl);
      })
      .catch(() => setPdfUrl(null));
    return () => {
      revoked = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [orderId, expired]);

  return (
    <Paper
      variant="outlined"
      sx={{ overflow: 'hidden', position: { md: 'sticky' }, top: { md: 80 } }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          height: 44,
          borderBottom: (t) => `1px solid ${(t.vars ?? t).palette.surface.border}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
            Packing slip
          </Typography>
          {closed && !expired && (
            <Typography variant="caption" noWrap sx={{ color: 'text.tertiary' }}>
              Deleted {SLIP_RETENTION_DAYS} days after shipping or cancelling
            </Typography>
          )}
        </Box>
        {pdfUrl && (
          <Tooltip title="Open in new tab" arrow>
            <IconButton
              size="small"
              component={Link}
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
            >
              <OpenInNewRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      {pdfUrl ? (
        <Box
          component="iframe"
          src={`${pdfUrl}#toolbar=0`}
          title="Packing slip"
          sx={{
            width: '100%',
            height: { xs: 460, md: 'calc(100vh - 180px)' },
            border: 'none',
            display: 'block',
            bgcolor: 'surface.inset',
          }}
        />
      ) : (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: 'text.tertiary' }}>
            {expired
              ? `Packing slip deleted (removed ${SLIP_RETENTION_DAYS} days after shipping or cancelling).`
              : 'Packing slip unavailable.'}
          </Typography>
        </Box>
      )}
    </Paper>
  );
}
