import {
  isPropsObject,
  isPropsObjectOrCallback,
  normalizeLayouts,
  type Page,
  type PageProps,
} from '@inertiajs/core'
import { createElement, isValidElement } from 'hono/jsx'
import type { Child, JSXNode } from 'hono/jsx/dom'
import type { InertiaAppProps, ResolvedComponent } from './types'

type DynamicLayoutProps = {
  shared?: Record<string, unknown>
  named?: Record<string, Record<string, unknown>>
}

type RenderWithLayoutsOptions = {
  Component: ResolvedComponent
  page: Page
  props: PageProps
  key?: number | null
  defaultLayout?: InertiaAppProps['defaultLayout']
  dynamicLayoutProps?: DynamicLayoutProps
}

const isComponent = (value: unknown): value is ResolvedComponent => typeof value === 'function'

const isRenderFunction = (value: unknown): boolean =>
  typeof value === 'function' && (value as Function).length === 1 && typeof (value as Function).prototype === 'undefined'

const isLayoutResolver = (value: unknown): boolean =>
  typeof value === 'function' && (value as Function).length <= 1 && typeof (value as Function).prototype === 'undefined'

export default function renderWithLayouts({
  Component,
  page,
  props,
  key = null,
  defaultLayout,
  dynamicLayoutProps = {},
}: RenderWithLayoutsOptions): Child {
  const child = createElement(Component as unknown as (props: Record<string, unknown>) => JSXNode, {
    key,
    ...props,
  } as Record<string, unknown>) as never

  let effectiveLayout: unknown
  let callbackProps: Record<string, unknown> | null = null
  const layoutValue = Component.layout

  if (isLayoutResolver(layoutValue)) {
    const result = (layoutValue as Function)(props)

    if (isValidElement(result)) {
      return (layoutValue as Function)(child) as Child
    }

    if (isPropsObjectOrCallback(result, isComponent)) {
      effectiveLayout = defaultLayout?.(page.component, page)
      callbackProps = result as Record<string, unknown>
    } else {
      effectiveLayout = result
    }
  } else if (isPropsObject(layoutValue, isComponent)) {
    effectiveLayout = defaultLayout?.(page.component, page)
    callbackProps = layoutValue as unknown as Record<string, unknown>
  } else {
    effectiveLayout = layoutValue ?? defaultLayout?.(page.component, page)
  }

  let layouts = normalizeLayouts(
    effectiveLayout,
    isComponent,
    layoutValue && !callbackProps ? isRenderFunction : undefined,
  )

  if (callbackProps) {
    layouts = layouts.map((layout) => ({ ...layout, props: { ...layout.props, ...callbackProps } }))
  }

  return layouts.reduceRight<Child>((childNode, layout) => {
    return createElement(
      layout.component as unknown as (props: Record<string, unknown>) => JSXNode,
      {
        ...props,
        ...layout.props,
        ...dynamicLayoutProps.shared,
        ...(layout.name ? dynamicLayoutProps.named?.[layout.name] || {} : {}),
      } as Record<string, unknown>,
      childNode as never,
    ) as never
  }, child)
}
