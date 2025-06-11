import { type Writable, writable } from "svelte/store";

export enum StoreResultState {
  IDLE = "idle",
  LOADING = "loading",
  LOADED = "loaded",
  ERROR = "error",
}

export type StoreResult<T> = {
  state: StoreResultState;
  data: T;
  errorDetails?: ErrorDetails;
};

export class ErrorDetails {
  private readonly error: Error;
  private readonly displayCode: number;

  constructor(error: Error, displayCode: number) {
    this.error = error;
    this.displayCode = displayCode;
  }

  public getDisplayCode(): number {
    return this.displayCode;
  }

  public getError(): Error {
    return this.error;
  }

  public getDisplayCodeAsString(): string {
    return "0x" + this.displayCode.toString(16).toUpperCase();
  }
}

export abstract class Store<T> {
  private state: StoreResult<T> = $state(this.getDefaultState());
  private readonly store: Writable<StoreResult<T>> = writable<StoreResult<T>>(
    this.state,
  );

  public subscribe(
    run: (value: StoreResult<T>) => void,
    invalidate?: (value?: StoreResult<T>) => void,
  ) {
    return this.store.subscribe(run, invalidate);
  }

  public update(fn: (value: StoreResult<T>) => StoreResult<T>) {
    this.store.update(fn);
  }

  public reset() {
    this.changeStateAndData(
      this.getDefaultState().state,
      this.getDefaultState().data,
    );
  }

  public getDefaultState(): StoreResult<T> {
    return {
      state: StoreResultState.IDLE,
      data: null as T,
    };
  }

  public clearData() {
    this.changeData(this.getDefaultState().data);
    this.changeState(StoreResultState.IDLE);
  }

  protected changeState(state: StoreResultState) {
    this.state.state = state;
    this.updateStore();
  }

  protected changeData(data: T) {
    this.state.data = data;
    this.updateStore();
  }

  protected changeStateAndData(state: StoreResultState, data: T) {
    this.state.state = state;
    this.state.data = data;
    this.updateStore();
  }

  protected changeStateAndError(
    state: StoreResultState,
    error: Error,
    displayCode: number,
  ) {
    this.state.state = state;
    this.state.errorDetails = new ErrorDetails(error, displayCode);
    this.updateStore();
  }

  public get() {
    // If there is no data, reset the state to the default state
    if (this.state.data === null) {
      this.state = this.getDefaultState();
    }
    return this.state;
  }

  public getData(): T {
    return this.state.data;
  }

  public getState(): StoreResultState {
    return this.state.state;
  }

  public getErrorDetails(): ErrorDetails | undefined {
    return this.state.errorDetails;
  }

  protected triggerError(error: Error, displayCode: number) {
    console.error(error);
    this.changeStateAndError(StoreResultState.ERROR, error, displayCode);
  }

  private updateStore() {
    this.store.update(() => this.state);
  }
}
