import { useId, type ReactNode } from 'react'
import { cn } from '@utils/cn'
import { Label } from './Label'

/**
 * Wiring handed to the control rendered inside a Field. Spread these onto an
 * Input/Textarea/Select so the label, description and error are correctly
 * associated for assistive tech:
 *
 *   <Field label="이메일" error={errors.email?.message}>
 *     {(p) => <Input {...p} type="email" />}
 *   </Field>
 */
export interface FieldControlProps {
  id: string
  'aria-describedby'?: string
  'aria-invalid'?: true
  'aria-required'?: true
}

export interface FieldProps {
  label: ReactNode
  /** Helper text under the control. Hidden once an `error` is present. */
  description?: ReactNode
  /** Validation message; switches the field into its invalid (coral) state. */
  error?: ReactNode
  required?: boolean
  /** Override the generated control id (e.g. to match an external label). */
  id?: string
  className?: string
  children: (control: FieldControlProps) => ReactNode
}

export function Field({
  label,
  description,
  error,
  required = false,
  id,
  className,
  children,
}: FieldProps) {
  const reactId = useId()
  const fieldId = id ?? reactId
  const descId = `${fieldId}-description`
  const errorId = `${fieldId}-error`
  const invalid = Boolean(error)

  // Point the control at whichever helper line is actually rendered so screen
  // readers announce the right text and never a stale/empty node.
  let describedBy: string | undefined
  if (invalid) {
    describedBy = errorId
  } else if (description) {
    describedBy = descId
  }

  const control: FieldControlProps = {
    id: fieldId,
    'aria-describedby': describedBy,
    'aria-invalid': invalid || undefined,
    'aria-required': required || undefined,
  }

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={fieldId} required={required}>
        {label}
      </Label>
      {children(control)}
      {invalid ? (
        <p id={errorId} role="alert" className="text-[0.8rem] text-coral-deep dark:text-coral">
          {error}
        </p>
      ) : (
        description && (
          <p id={descId} className="text-[0.8rem] text-ink-mute dark:text-bone-mute">
            {description}
          </p>
        )
      )}
    </div>
  )
}
