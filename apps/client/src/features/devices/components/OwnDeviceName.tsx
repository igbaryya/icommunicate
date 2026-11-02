import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { MAX_DEVICE_NAME_LENGTH, type Device } from '@icommunicate/shared';
import { getErrorMessage } from '@/lib/errors';
import { useRenameDeviceMutation } from '@/services/api';

interface OwnDeviceNameProps {
  device: Device;
}

export function OwnDeviceName({ device }: OwnDeviceNameProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(device.hostname);
  const inputRef = useRef<HTMLInputElement>(null);
  const ignoreBlur = useRef(false);
  const pending = useRef(false);
  const [rename, { isLoading }] = useRenameDeviceMutation();

  useEffect(() => {
    if (!editing) setValue(device.hostname);
  }, [device.hostname, editing]);

  useEffect(() => {
    if (!editing) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [editing]);

  const cancel = () => {
    ignoreBlur.current = true;
    setValue(device.hostname);
    setEditing(false);
  };

  const save = async () => {
    if (pending.current) return;
    const name = value.trim();
    if (!name || name === device.hostname) {
      cancel();
      return;
    }
    pending.current = true;
    try {
      await rename({ hostname: name }).unwrap();
      setEditing(false);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not rename this machine'));
      inputRef.current?.focus();
    } finally {
      pending.current = false;
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void save();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      cancel();
    }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={value}
        maxLength={MAX_DEVICE_NAME_LENGTH}
        disabled={isLoading}
        aria-label="Your machine name"
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => {
          if (ignoreBlur.current) {
            ignoreBlur.current = false;
            return;
          }
          void save();
        }}
        className="w-full border-b border-accent bg-transparent text-sm font-semibold outline-none"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="group flex w-full min-w-0 cursor-pointer items-center gap-1 text-left"
      aria-label={`Rename ${device.hostname}`}
    >
      <span className="truncate text-sm font-semibold">{device.hostname}</span>
      <Pencil className="size-3 shrink-0 text-muted opacity-60 transition-opacity group-hover:opacity-100" />
    </button>
  );
}
