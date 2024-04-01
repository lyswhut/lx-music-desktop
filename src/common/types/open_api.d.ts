declare namespace LX {
  namespace OpenAPI {
    interface Status {
      status: boolean
      message: string
      address: string
    }
    interface EnableServer {
      enable: boolean
      port: string
      bindLan: boolean
    }

    interface ActionBase <A> {
      action: A
    }
    interface ActionData<A, D> extends ActionBase<A> {
      data: D
    }
    type Action<A, D = undefined> = D extends undefined ? ActionBase<A> : ActionData<A, D>

    type Actions = Action<'status'>
    | Action<'enable', EnableServer>

  }
}
