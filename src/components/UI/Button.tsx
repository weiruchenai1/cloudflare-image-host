import { forwardRef } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/utils/cn'
import LoadingSpinner from './LoadingSpinner'

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'size'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  children: React.ReactNode
}

const variants = {
  primary: 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg hover:shadow-xl border-transparent',
  secondary: 'bg-gray-600 hover:bg-gray-700 text-white shadow-lg hover:shadow-xl border-transparent',
  outline: 'border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 bg-transparent',
  ghost: 'text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 bg-transparent border-transparent',
  danger: 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl border-transparent',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    variant = 'primary', 
    size = 'md', 
    loading = false, 
    disabled = false, 
    className, 
    children, 
    ...props 
  }, ref) => {
    const isDisabled = disabled || loading

    return (
      <motion.button
        ref={ref}
        whileHover={!isDisabled ? { scale: 1.02 } : undefined}
        whileTap={!isDisabled ? { scale: 0.98 } : undefined}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-lg border transition-all duration-200 focus-ring disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          isDisabled && 'pointer-events-none',
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <LoadingSpinner 
            size="sm" 
            className="mr-2" 
            color={variant === 'outline' || variant === 'ghost' ? 'primary' : 'white'} 
          />
        )}
        {children}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

export default Button
