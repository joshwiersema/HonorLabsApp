import { useState, useEffect } from 'react';
import { Check, Loader2, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { WcSetting } from '@/types/settings';

interface SettingFieldProps {
  setting: WcSetting;
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  isSaving: boolean;
  isChanged: boolean;
  justSaved: boolean;
}

export function SettingField({
  setting,
  value,
  onChange,
  onSave,
  isSaving,
  isChanged,
  justSaved,
}: SettingFieldProps) {
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (justSaved) {
      setShowSaved(true);
      const timer = setTimeout(() => setShowSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [justSaved]);

  const renderInput = () => {
    switch (setting.type) {
      case 'checkbox':
        return (
          <Switch
            checked={value === 'yes'}
            onCheckedChange={(checked) => onChange(checked ? 'yes' : 'no')}
          />
        );

      case 'select':
        return (
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {setting.options &&
                Object.entries(setting.options).map(([optValue, optLabel]) => (
                  <SelectItem key={optValue} value={optValue}>
                    {optLabel}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        );

      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            className="max-w-lg"
          />
        );

      case 'color':
        return (
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={value || '#000000'}
              onChange={(e) => onChange(e.target.value)}
              className="h-9 w-14 cursor-pointer rounded border border-input p-0.5"
            />
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-28 font-mono text-xs"
              placeholder="#000000"
            />
          </div>
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="max-w-32"
          />
        );

      case 'email':
        return (
          <Input
            type="email"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="max-w-sm"
          />
        );

      case 'url':
      case 'image':
        return (
          <Input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="max-w-lg"
            placeholder="https://..."
          />
        );

      case 'text':
      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="max-w-sm"
          />
        );
    }
  };

  // Checkbox fields use a horizontal layout
  const isCheckbox = setting.type === 'checkbox';

  return (
    <div className="space-y-2 py-4 first:pt-0 last:pb-0">
      <div
        className={
          isCheckbox ? 'flex items-center justify-between gap-4' : 'space-y-1'
        }
      >
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">{setting.label}</Label>
          {setting.description && (
            <p
              className="text-xs text-muted-foreground"
              dangerouslySetInnerHTML={{
                __html: setting.description.replace(/<\/?[^>]+(>|$)/g, ''),
              }}
            />
          )}
        </div>
        {isCheckbox && renderInput()}
      </div>

      {!isCheckbox && <div>{renderInput()}</div>}

      {/* Save / reset controls */}
      <div className="flex items-center gap-2 pt-1">
        {isChanged && !isSaving && (
          <>
            <Button size="sm" variant="default" onClick={onSave} className="h-7 px-2.5 text-xs">
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onChange(setting.value)}
              className="h-7 px-2 text-xs text-muted-foreground"
            >
              <RotateCcw className="mr-1 h-3 w-3" />
              Reset
            </Button>
          </>
        )}

        {isSaving && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving...
          </span>
        )}

        {showSaved && !isSaving && !isChanged && (
          <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
            <Check className="h-3 w-3" />
            Saved
          </span>
        )}
      </div>
    </div>
  );
}
