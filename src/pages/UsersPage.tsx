import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { AppShell } from '../components/AppShell';
import { Mono } from '../components/ui/Mono';
import { RelativeTime } from '../components/ui/RelativeTime';
import { EmptyState } from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/ui/TableSkeleton';
import { useToast } from '../components/ToastProvider';
import { getApiErrorMessage } from '../api/client';
import { createUser, listUsers, renameUser, resetUserPassword, setUserActive } from '../api/users';
import { DISPLAY_NAME_MAX_LENGTH } from '../lib/constants';
import type { AdminUserListItem, GeneratedPasswordResponse } from '../types';

const panelSx = {
  border: (t: import('@mui/material/styles').Theme) =>
    `1px solid ${(t.vars ?? t).palette.surface.border}`,
  borderRadius: 3,
  bgcolor: 'surface.panel',
  overflow: 'hidden',
} as const;

function RolePill({ role }: { role: string }) {
  const admin = role === 'Admin';
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        height: 22,
        px: 1.25,
        borderRadius: 1,
        fontSize: '0.75rem',
        fontWeight: 600,
        color: admin ? 'primary.dark' : 'text.secondary',
        bgcolor: admin ? 'primary.light' : 'surface.sunken',
      }}
    >
      {admin ? 'Admin' : 'Staff'}
    </Box>
  );
}

export function UsersPage() {
  const { notify } = useToast();
  const [users, setUsers] = useState<AdminUserListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [credential, setCredential] = useState<GeneratedPasswordResponse | null>(null);
  const [renameTarget, setRenameTarget] = useState<AdminUserListItem | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<AdminUserListItem | null>(null);
  const [menu, setMenu] = useState<{ anchor: HTMLElement; user: AdminUserListItem } | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setUsers(await listUsers());
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load users.'));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const runReset = async (user: AdminUserListItem) => {
    try {
      const result = await resetUserPassword(user.id);
      setCredential(result);
      notify(`New password generated for ${user.displayName}.`, 'success');
      load();
    } catch (err) {
      notify(getApiErrorMessage(err, 'Could not reset the password.'), 'error');
    }
  };

  const runDeactivate = async (user: AdminUserListItem) => {
    try {
      await setUserActive(user.id, false);
      notify(`${user.displayName} can no longer sign in.`, 'success');
      setDeactivateTarget(null);
      load();
    } catch (err) {
      notify(getApiErrorMessage(err, 'Could not deactivate the user.'), 'error');
    }
  };

  const runActivate = async (user: AdminUserListItem) => {
    try {
      await setUserActive(user.id, true);
      notify(`${user.displayName} can sign in again.`, 'success');
      load();
    } catch (err) {
      notify(getApiErrorMessage(err, 'Could not reactivate the user.'), 'error');
    }
  };

  return (
    <AppShell
      title="Users"
      titleMeta={
        users ? (
          <Typography
            component="span"
            sx={{ fontSize: '0.75rem', color: 'text.disabled', fontVariantNumeric: 'tabular-nums' }}
          >
            {users.length}
          </Typography>
        ) : null
      }
      actions={
        <Button
          variant="contained"
          size="small"
          startIcon={<PersonAddOutlinedIcon sx={{ fontSize: 16 }} />}
          onClick={() => setAddOpen(true)}
        >
          Add user
        </Button>
      }
    >
      <Stack spacing={2}>
        <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 640 }}>
          Everyone who uses DigitalBox needs their own account. Passwords are generated here and
          shown once — hand them to the person directly. Admin accounts are created from the server
          and can't be made here.
        </Typography>

        {error && <Alert severity="error">{error}</Alert>}

        {!users ? (
          <Box sx={panelSx}>
            <TableSkeleton rows={5} columns={5} />
          </Box>
        ) : users.length === 0 ? (
          <Box sx={panelSx}>
            <EmptyState
              icon={<PersonAddOutlinedIcon />}
              title="No users yet"
              description="Add an account for each person who works the queue."
              action={
                <Button variant="contained" size="small" onClick={() => setAddOpen(true)}>
                  Add user
                </Button>
              }
            />
          </Box>
        ) : (
          <Box sx={panelSx}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Username</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last sign-in</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} sx={{ opacity: user.isActive ? 1 : 0.55 }}>
                    <TableCell sx={{ fontWeight: 600 }}>{user.displayName}</TableCell>
                    <TableCell>
                      <Mono muted>{user.username}</Mono>
                    </TableCell>
                    <TableCell>
                      <RolePill role={user.role} />
                    </TableCell>
                    <TableCell sx={{ color: user.isActive ? 'success.dark' : 'text.disabled' }}>
                      {user.isActive ? 'Active' : 'Deactivated'}
                    </TableCell>
                    <TableCell>
                      <RelativeTime value={user.lastLoginAt} />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        aria-label={`Actions for ${user.displayName}`}
                        onClick={(e) => setMenu({ anchor: e.currentTarget, user })}
                      >
                        <MoreVertRoundedIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Stack>

      <Menu anchorEl={menu?.anchor ?? null} open={menu !== null} onClose={() => setMenu(null)}>
        <MenuItem
          onClick={() => {
            if (menu) runReset(menu.user);
            setMenu(null);
          }}
        >
          Reset password
        </MenuItem>
        <MenuItem
          onClick={() => {
            setRenameTarget(menu?.user ?? null);
            setMenu(null);
          }}
        >
          Rename
        </MenuItem>
        {menu?.user.isActive ? (
          <MenuItem
            onClick={() => {
              setDeactivateTarget(menu?.user ?? null);
              setMenu(null);
            }}
            sx={{ color: 'error.main' }}
          >
            Deactivate
          </MenuItem>
        ) : (
          <MenuItem
            onClick={() => {
              if (menu) runActivate(menu.user);
              setMenu(null);
            }}
          >
            Reactivate
          </MenuItem>
        )}
      </Menu>

      {addOpen && (
        <AddUserDialog
          onClose={() => setAddOpen(false)}
          onCreated={(result) => {
            setAddOpen(false);
            setCredential(result);
            load();
          }}
        />
      )}

      {credential && (
        <GeneratedPasswordDialog credential={credential} onClose={() => setCredential(null)} />
      )}

      {renameTarget && (
        <RenameDialog
          target={renameTarget}
          onClose={() => setRenameTarget(null)}
          onRenamed={() => {
            setRenameTarget(null);
            load();
          }}
        />
      )}

      <Dialog
        open={deactivateTarget !== null}
        onClose={() => setDeactivateTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Deactivate {deactivateTarget?.displayName}?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            They will be signed out immediately and won't be able to sign in again until you
            reactivate the account. Their history stays intact.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="text" onClick={() => setDeactivateTarget(null)}>
            Back
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => deactivateTarget && runDeactivate(deactivateTarget)}
          >
            Deactivate
          </Button>
        </DialogActions>
      </Dialog>
    </AppShell>
  );
}

function AddUserDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (result: GeneratedPasswordResponse) => void;
}) {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      onCreated(await createUser(username.trim(), displayName.trim()));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not create the user.'));
      setBusy(false);
    }
  };

  return (
    <Dialog open onClose={busy ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Add user</DialogTitle>
      <Stack component="form" onSubmit={submit}>
        <DialogContent>
          <Stack spacing={2}>
            <TextField
              label="Full name"
              required
              autoFocus
              size="small"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              slotProps={{ htmlInput: { maxLength: DISPLAY_NAME_MAX_LENGTH } }}
              helperText="Shown on the order history."
            />
            <TextField
              label="Username"
              required
              size="small"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              slotProps={{ htmlInput: { maxLength: 64 } }}
              helperText="Letters, digits, dot, dash or underscore. Used to sign in — can't be changed later."
            />
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="text" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={busy || username.trim().length < 2 || displayName.trim().length === 0}
          >
            {busy ? 'Creating…' : 'Create'}
          </Button>
        </DialogActions>
      </Stack>
    </Dialog>
  );
}

function RenameDialog({
  target,
  onClose,
  onRenamed,
}: {
  target: AdminUserListItem;
  onClose: () => void;
  onRenamed: () => void;
}) {
  const { notify } = useToast();
  const [name, setName] = useState(target.displayName);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await renameUser(target.id, name.trim());
      notify('Name updated.', 'success');
      onRenamed();
    } catch (err) {
      notify(getApiErrorMessage(err, 'Could not rename the user.'), 'error');
      setBusy(false);
    }
  };

  return (
    <Dialog open onClose={busy ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Rename user</DialogTitle>
      <Stack component="form" onSubmit={submit}>
        <DialogContent>
          <TextField
            label="Full name"
            required
            autoFocus
            fullWidth
            size="small"
            value={name}
            onChange={(e) => setName(e.target.value)}
            slotProps={{ htmlInput: { maxLength: DISPLAY_NAME_MAX_LENGTH } }}
          />
        </DialogContent>
        <DialogActions>
          <Button variant="text" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={busy || name.trim().length === 0 || name.trim() === target.displayName}
          >
            Save
          </Button>
        </DialogActions>
      </Stack>
    </Dialog>
  );
}

function GeneratedPasswordDialog({
  credential,
  onClose,
}: {
  credential: GeneratedPasswordResponse;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(credential.generatedPassword);
      setCopied(true);
    } catch {
      /* clipboard unavailable — the passphrase is still visible to type out */
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Password for {credential.user.displayName}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Give this to <strong>{credential.user.username}</strong> now. It won't be shown again —
            if it's lost, generate a new one.
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              p: 2,
              borderRadius: 2,
              border: (t) => `1px solid ${(t.vars ?? t).palette.surface.border}`,
              bgcolor: 'surface.sunken',
            }}
          >
            <Box
              className="db-mono"
              sx={{ flex: 1, fontSize: '1rem', fontWeight: 600, wordBreak: 'break-all' }}
            >
              {credential.generatedPassword}
            </Box>
            <Tooltip title={copied ? 'Copied' : 'Copy'} placement="top" arrow>
              <IconButton size="small" onClick={copy} aria-label="Copy password">
                {copied ? (
                  <CheckRoundedIcon sx={{ fontSize: 18, color: 'success.main' }} />
                ) : (
                  <ContentCopyRoundedIcon sx={{ fontSize: 18 }} />
                )}
              </IconButton>
            </Tooltip>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onClose}>
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
}
