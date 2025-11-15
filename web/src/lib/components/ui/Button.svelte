<script lang="ts">
  type Variant = 'default' | 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  type Size = 'sm' | 'md' | 'lg';

  export let variant: Variant = 'default';
  export let size: Size = 'md';
  export let type: 'button' | 'submit' | 'reset' = 'button';
  export let disabled: boolean = false;
  let className: string = '';
  export { className as class };

  const variantClasses = {
    default: 'bg-gray-700 text-white hover:bg-gray-600 border border-gray-600',
    primary: 'bg-blue-600 text-white hover:bg-blue-700 border border-blue-600',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 border border-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 border border-red-600',
    success: 'bg-green-600 text-white hover:bg-green-700 border border-green-600',
    ghost: 'bg-transparent text-gray-300 hover:bg-gray-700 border border-gray-600',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  const baseClasses = 'rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed';
</script>

<button
  {type}
  {disabled}
  class="{baseClasses} {variantClasses[variant]} {sizeClasses[size]} {className}"
  on:click
>
  <slot />
</button>
