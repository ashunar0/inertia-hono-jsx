import {
  CancelToken,
  ErrorValue,
  FormDataErrors,
  FormDataKeys,
  FormDataType,
  FormDataValues,
  Method,
  OptimisticCallback,
  Progress,
  RequestPayload,
  router,
  UrlMethodPair,
  UseFormArguments,
  UseFormSubmitArguments,
  UseFormSubmitOptions,
  UseFormTransformCallback,
  UseFormUtils,
  UseFormWithPrecognitionArguments,
  VisitOptions,
} from '@inertiajs/core'
import { cloneDeep } from 'es-toolkit'
import type { NamedInputEvent, PrecognitionPath, ValidationConfig, Validator } from 'laravel-precognition'
import { useCallback, useMemo, useRef, useState } from 'hono/jsx'
import { useIsomorphicLayoutEffect } from './react'
import useFormState, {
  type SetDataAction,
  type SetDataByKeyValuePair,
  type SetDataByMethod,
  type SetDataByObject,
} from './useFormState'
import useRemember from './useRemember'

// Re-export types that were moved to useFormState
export { SetDataAction, SetDataByKeyValuePair, SetDataByMethod, SetDataByObject }

type PrecognitionValidationConfig<TKeys> = ValidationConfig & {
  only?: TKeys[] | Iterable<TKeys> | ArrayLike<TKeys>
}

export interface InertiaFormProps<TForm extends object> {
  data: TForm
  isDirty: boolean
  errors: FormDataErrors<TForm>
  hasErrors: boolean
  processing: boolean
  progress: Progress | null
  wasSuccessful: boolean
  recentlySuccessful: boolean
  setData: SetDataAction<TForm>
  transform: (callback: UseFormTransformCallback<TForm>) => void
  setDefaults: {
    (): void
    <T extends FormDataKeys<TForm>>(field: T, value: FormDataValues<TForm, T>): void
    (fields: Partial<TForm>): void
  }
  reset: <K extends FormDataKeys<TForm>>(...fields: K[]) => void
  clearErrors: <K extends FormDataKeys<TForm>>(...fields: K[]) => void
  resetAndClearErrors: <K extends FormDataKeys<TForm>>(...fields: K[]) => void
  setError: {
    <K extends FormDataKeys<TForm>>(field: K, value: ErrorValue): void
    (errors: FormDataErrors<TForm>): void
  }
  submit: (...args: UseFormSubmitArguments) => void
  get: (url: string, options?: UseFormSubmitOptions) => void
  post: (url: string, options?: UseFormSubmitOptions) => void
  put: (url: string, options?: UseFormSubmitOptions) => void
  patch: (url: string, options?: UseFormSubmitOptions) => void
  delete: (url: string, options?: UseFormSubmitOptions) => void
  cancel: () => void
  dontRemember: <K extends FormDataKeys<TForm>>(...fields: K[]) => void
  optimistic: <TProps>(callback: OptimisticCallback<TProps>) => void
  withPrecognition: (...args: UseFormWithPrecognitionArguments) => void
}

export interface InertiaFormValidationProps<TForm extends object> {
  invalid: <K extends FormDataKeys<TForm>>(field: K) => boolean
  setValidationTimeout: (duration: number) => void
  touch: <K extends FormDataKeys<TForm>>(
    field: K | NamedInputEvent | Array<K>,
    ...fields: K[]
  ) => void
  touched: <K extends FormDataKeys<TForm>>(field?: K) => boolean
  valid: <K extends FormDataKeys<TForm>>(field: K) => boolean
  validate: <K extends FormDataKeys<TForm> | PrecognitionPath<TForm>>(
    field?: K | NamedInputEvent | PrecognitionValidationConfig<K>,
    config?: PrecognitionValidationConfig<K>,
  ) => void
  validateFiles: () => void
  validating: boolean
  validator: () => Validator
  withAllErrors: () => void
  withoutFileValidation: () => void
  setErrors: (errors: FormDataErrors<TForm>) => void
  forgetError: <K extends FormDataKeys<TForm> | NamedInputEvent>(field: K) => void
}

export type InertiaForm<TForm extends object> = InertiaFormProps<TForm>
export type InertiaPrecognitiveFormProps<TForm extends object> = InertiaFormProps<TForm> &
  InertiaFormValidationProps<TForm>

export default function useForm<TForm extends FormDataType<TForm>>(
  method: Method | (() => Method),
  url: string | (() => string),
  data: TForm | (() => TForm),
): InertiaPrecognitiveFormProps<TForm>
export default function useForm<TForm extends FormDataType<TForm>>(
  urlMethodPair: UrlMethodPair | (() => UrlMethodPair),
  data: TForm | (() => TForm),
): InertiaPrecognitiveFormProps<TForm>
export default function useForm<TForm extends FormDataType<TForm>>(
  rememberKey: string,
  data: TForm | (() => TForm),
): InertiaFormProps<TForm>
export default function useForm<TForm extends FormDataType<TForm>>(data: TForm | (() => TForm)): InertiaFormProps<TForm>
export default function useForm<TForm extends FormDataType<TForm>>(): InertiaFormProps<TForm>
export default function useForm<TForm extends FormDataType<TForm>>(
  ...args: UseFormArguments<TForm>
): InertiaFormProps<TForm> | InertiaPrecognitiveFormProps<TForm> {
  const { rememberKey, data, precognitionEndpoint } = UseFormUtils.parseUseFormArguments<TForm>(...args)

  // Resolve initial data for remember functionality hooks
  const initialDefaults = typeof data === 'function' ? cloneDeep(data()) : cloneDeep(data)

  const cancelToken = useRef<CancelToken | null>(null)
  const excludeKeysRef = useRef<FormDataKeys<TForm>[]>([])
  const pendingOptimisticRef = useRef<OptimisticCallback | null>(null)

  // For remember functionality, we need custom state hooks
  const useDataState = rememberKey
    ? () => useRemember<TForm>(initialDefaults, `${rememberKey}:data`, excludeKeysRef as { current: string[] })
    : undefined

  const useErrorsState = rememberKey
    ? () => useRemember<FormDataErrors<TForm>>({} as FormDataErrors<TForm>, `${rememberKey}:errors`)
    : undefined

  const {
    form: baseForm,
    setDefaultsState,
    transformRef,
    precognitionEndpointRef,
    dataRef,
    isMounted,
    setProcessing,
    setProgress,
    markAsSuccessful,
    clearErrors,
    setError,
    defaultsCalledInOnSuccessRef,
    resetBeforeSubmit,
    finishProcessing,
  } = useFormState<TForm>({
    data,
    precognitionEndpoint,
    useDataState,
    useErrorsState,
  })

  // Handle dataAsDefaults pattern for setDefaults synchronization
  // When setDefaults() is called without args immediately after setData(),
  // dataRef.current may be stale. This layout effect ensures the current
  // data state is used as defaults.
  const [dataAsDefaults, setDataAsDefaults] = useState(false)

  const originalSetDefaults = baseForm.setDefaults
  baseForm.setDefaults = useCallback(
    (fieldOrFields?: FormDataKeys<TForm> | Partial<TForm>, maybeValue?: unknown) => {
      if (typeof fieldOrFields === 'undefined') {
        setDataAsDefaults(true)
      }

      return originalSetDefaults(fieldOrFields as any, maybeValue as any)
    },
    [originalSetDefaults],
  ) as typeof baseForm.setDefaults

  useIsomorphicLayoutEffect(() => {
    if (!dataAsDefaults) {
      return
    }

    if (baseForm.isDirty) {
      setDefaultsState(baseForm.data)
    }

    setDataAsDefaults(false)
  }, [dataAsDefaults])

  const submit = useCallback(
    (...args: UseFormSubmitArguments) => {
      const { method, url, options } = UseFormUtils.parseSubmitArguments(args, precognitionEndpointRef.current)

      defaultsCalledInOnSuccessRef.current = false

      const _options: VisitOptions = {
        ...options,
        onCancelToken: (token) => {
          cancelToken.current = token

          return options.onCancelToken?.(token)
        },
        onBefore: (visit) => {
          resetBeforeSubmit()

          return options.onBefore?.(visit)
        },
        onStart: (visit) => {
          setProcessing(true)

          return options.onStart?.(visit)
        },
        onProgress: (event) => {
          setProgress(event || null)

          return options.onProgress?.(event)
        },
        onSuccess: async (page) => {
          if (isMounted.current) {
            markAsSuccessful()
          }

          const onSuccess = options.onSuccess ? await options.onSuccess(page) : null

          if (isMounted.current && !defaultsCalledInOnSuccessRef.current) {
            baseForm.setData((data: TForm) => {
              setDefaultsState(cloneDeep(data))
              return data
            })
          }

          return onSuccess
        },
        onError: (errors) => {
          if (isMounted.current) {
            clearErrors()
            setError(errors as FormDataErrors<TForm>)
          }

          return options.onError?.(errors)
        },
        onCancel: () => {
          return options.onCancel?.()
        },
        onFinish: (visit) => {
          if (isMounted.current) {
            finishProcessing()
          }

          cancelToken.current = null

          return options.onFinish?.(visit)
        },
      }

      _options.optimistic = _options.optimistic ?? pendingOptimisticRef.current ?? undefined
      pendingOptimisticRef.current = null

      const transformedData = transformRef.current(dataRef.current) as RequestPayload

      if (method === 'delete') {
        router.delete(url, { ..._options, data: transformedData })
      } else {
        router[method](url, transformedData, _options)
      }
    },
    [clearErrors, setError, transformRef],
  )

  const cancel = useCallback(() => {
    if (cancelToken.current) {
      cancelToken.current.cancel()
    }
  }, [])

  const submitMethods = useMemo(
    () => ({
      get: (url: string, options: VisitOptions = {}) => submit('get', url, options),
      post: (url: string, options: VisitOptions = {}) => submit('post', url, options),
      put: (url: string, options: VisitOptions = {}) => submit('put', url, options),
      patch: (url: string, options: VisitOptions = {}) => submit('patch', url, options),
      delete: (url: string, options: VisitOptions = {}) => submit('delete', url, options),
    }),
    [submit],
  )

  // Add useForm-specific methods to the form object
  Object.assign(baseForm, {
    submit,
    ...submitMethods,
    cancel,
    dontRemember: <K extends FormDataKeys<TForm>>(...keys: K[]) => {
      excludeKeysRef.current = keys
    },

    optimistic: <TProps>(callback: OptimisticCallback<TProps>) => {
      pendingOptimisticRef.current = callback as OptimisticCallback
    },
  })

  // Cast to the full form type (baseForm now has submit methods)
  const form = baseForm as unknown as InertiaFormProps<TForm>

  const originalWithPrecognition = baseForm.withPrecognition
  form.withPrecognition = (...args: UseFormWithPrecognitionArguments): void => {
    originalWithPrecognition(...args)
  }

  return precognitionEndpointRef.current ? (form as InertiaPrecognitiveFormProps<TForm>) : form
}
