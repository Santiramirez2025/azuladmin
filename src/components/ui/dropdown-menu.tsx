"use client"

import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react"

import { cn } from "@/lib/utils-client"

function DropdownMenu({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

function DropdownMenuPortal({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  return (
    <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
  )
}

function DropdownMenuTrigger({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      {...props}
    />
  )
}

function DropdownMenuContent({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(
          // Premium glassmorphism base
          "bg-white/95 backdrop-blur-xl border-slate-200/60",
          // Enhanced shadows with color
          "shadow-2xl shadow-slate-900/10",
          // Smooth animations
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[state=closed]:duration-200 data-[state=open]:duration-300",
          // Slide animations with easing
          "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
          "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          // Layout with modern spacing
          "z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[12rem]",
          "origin-(--radix-dropdown-menu-content-transform-origin)",
          "overflow-x-hidden overflow-y-auto rounded-xl p-1.5",
          // Subtle inner glow
          "ring-1 ring-slate-900/5",
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
}

function DropdownMenuGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
  return (
    <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
  )
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean
  variant?: "default" | "destructive"
}) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        // Base styles with premium spacing
        "relative flex cursor-default items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium outline-hidden select-none",
        // Smooth transitions
        "transition-all duration-200 ease-out",
        // Default variant - premium hover with gradient
        "data-[variant=default]:text-slate-700",
        "data-[variant=default]:hover:bg-gradient-to-r data-[variant=default]:hover:from-blue-50 data-[variant=default]:hover:to-indigo-50/80",
        "data-[variant=default]:hover:text-blue-900 data-[variant=default]:hover:shadow-sm",
        "data-[variant=default]:focus:bg-gradient-to-r data-[variant=default]:focus:from-blue-50 data-[variant=default]:focus:to-indigo-50/80",
        "data-[variant=default]:focus:text-blue-900 data-[variant=default]:focus:ring-2 data-[variant=default]:focus:ring-blue-100",
        // Destructive variant - modern red with glow
        "data-[variant=destructive]:text-red-600",
        "data-[variant=destructive]:hover:bg-gradient-to-r data-[variant=destructive]:hover:from-red-50 data-[variant=destructive]:hover:to-orange-50/80",
        "data-[variant=destructive]:hover:text-red-700 data-[variant=destructive]:hover:shadow-sm data-[variant=destructive]:hover:shadow-red-500/10",
        "data-[variant=destructive]:focus:bg-gradient-to-r data-[variant=destructive]:focus:from-red-50 data-[variant=destructive]:focus:to-orange-50/80",
        "data-[variant=destructive]:focus:text-red-700 data-[variant=destructive]:focus:ring-2 data-[variant=destructive]:focus:ring-red-100",
        "data-[variant=destructive]:*:[svg]:!text-red-600",
        // Icon styling with contextual colors
        "[&_svg:not([class*='text-'])]:text-slate-500 hover:[&_svg:not([class*='text-'])]:text-blue-600",
        "data-[variant=destructive]:hover:[&_svg:not([class*='text-'])]:text-red-600",
        // Disabled state with subtle opacity
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
        // Inset for nested items
        "data-[inset]:pl-9",
        // SVG sizing and pointer events
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn(
        // Base premium styles
        "relative flex cursor-default items-center gap-2.5 rounded-lg py-2.5 pr-3 pl-9 text-sm font-medium outline-hidden select-none",
        "transition-all duration-200 ease-out",
        // Hover and focus with gradient
        "hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50/80",
        "hover:text-blue-900 hover:shadow-sm",
        "focus:bg-gradient-to-r focus:from-blue-50 focus:to-indigo-50/80",
        "focus:text-blue-900 focus:ring-2 focus:ring-blue-100",
        "text-slate-700",
        // Disabled state
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
        // Icon styling
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "[&_svg:not([class*='text-'])]:text-slate-500 hover:[&_svg:not([class*='text-'])]:text-blue-600",
        className
      )}
      checked={checked}
      {...props}
    >
      <span className="pointer-events-none absolute left-2.5 flex size-4 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <div className="flex items-center justify-center rounded-sm bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm">
            <CheckIcon className="size-3.5 text-white font-bold" strokeWidth={3} />
          </div>
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  )
}

function DropdownMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  )
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(
        // Base premium styles
        "relative flex cursor-default items-center gap-2.5 rounded-lg py-2.5 pr-3 pl-9 text-sm font-medium outline-hidden select-none",
        "transition-all duration-200 ease-out",
        // Hover and focus with gradient
        "hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50/80",
        "hover:text-blue-900 hover:shadow-sm",
        "focus:bg-gradient-to-r focus:from-blue-50 focus:to-indigo-50/80",
        "focus:text-blue-900 focus:ring-2 focus:ring-blue-100",
        "text-slate-700",
        // Disabled state
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
        // Icon styling
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "[&_svg:not([class*='text-'])]:text-slate-500 hover:[&_svg:not([class*='text-'])]:text-blue-600",
        className
      )}
      {...props}
    >
      <span className="pointer-events-none absolute left-2.5 flex size-4 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <div className="flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 p-0.5 shadow-sm shadow-blue-500/20">
            <CircleIcon className="size-1.5 fill-white text-white" />
          </div>
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  )
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-500",
        "data-[inset]:pl-9",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn(
        // Premium gradient separator
        "bg-gradient-to-r from-transparent via-slate-200 to-transparent -mx-1 my-2 h-px",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "ml-auto text-xs font-semibold tracking-wider text-slate-400",
        "group-hover:text-blue-500 transition-colors",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSub({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        // Base premium styles
        "flex cursor-default items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium outline-hidden select-none",
        "transition-all duration-200 ease-out",
        "text-slate-700",
        // Hover and focus with gradient
        "hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50/80",
        "hover:text-blue-900 hover:shadow-sm",
        "focus:bg-gradient-to-r focus:from-blue-50 focus:to-indigo-50/80",
        "focus:text-blue-900 focus:ring-2 focus:ring-blue-100",
        // Open state
        "data-[state=open]:bg-gradient-to-r data-[state=open]:from-blue-50 data-[state=open]:to-indigo-50/80",
        "data-[state=open]:text-blue-900 data-[state=open]:shadow-sm",
        // Icon styling
        "[&_svg:not([class*='text-'])]:text-slate-500 hover:[&_svg:not([class*='text-'])]:text-blue-600",
        "data-[state=open]:[&_svg:not([class*='text-'])]:text-blue-600",
        // Inset for nested items
        "data-[inset]:pl-9",
        // SVG sizing and pointer events
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto size-4 transition-transform group-hover:translate-x-0.5" />
    </DropdownMenuPrimitive.SubTrigger>
  )
}

function DropdownMenuSubContent({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  return (
    <DropdownMenuPrimitive.SubContent
      data-slot="dropdown-menu-sub-content"
      className={cn(
        // Premium glassmorphism base
        "bg-white/95 backdrop-blur-xl border-slate-200/60",
        // Enhanced shadows with color
        "shadow-2xl shadow-slate-900/10",
        // Smooth animations
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[state=closed]:duration-200 data-[state=open]:duration-300",
        // Slide animations
        "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        // Layout with modern spacing
        "z-50 min-w-[12rem] origin-(--radix-dropdown-menu-content-transform-origin)",
        "overflow-hidden rounded-xl p-1.5",
        // Subtle inner glow
        "ring-1 ring-slate-900/5",
        className
      )}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
}