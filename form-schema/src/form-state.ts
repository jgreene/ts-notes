import { observable, action, runInAction, computed } from 'mobx';

export type RecordState = {
    errors: string[];
    visible: boolean;
    disabled: boolean;
    dirty: boolean;
    touched: boolean;
    required: boolean;

    setErrors(errors: string[]): void;
    setVisibility(visible: boolean): void;
    setDisabled(disabled: boolean): void;
};

export type InputState<TValue> = {
    value: TValue;
    onChange(newValue: TValue): void;
} & RecordState;

export interface IInputState {
    inputState: RecordState;
}

type primitive = string | number | boolean | null | undefined;

export type FormStateType<T> = {
    [P in keyof T]: T[P] extends primitive ? InputState<T[P]> :
                    T[P] extends Array<infer U> ? Array<FormStateType<U>> & IInputState :
                    T[P] extends Function ? never :
                    FormState<T[P]>;
}

export type FormState<T> = FormStateType<T> & IInputState;

export type Constructor<T = {}> = new (...args: any[]) => T;

function getInputState(input: any): any
{
    if(typeof input === "string")
    {
        return new InputStateImpl(input) as any;
    }

    if(typeof input === "boolean")
    {
        return new InputStateImpl(input) as any;
    }

    if(typeof input === "number")
    {
        return new InputStateImpl(input) as any;
    }
    
    if(input === null)
    {
        return new InputStateImpl(null) as any;
    }

    if(input instanceof Array)
    {
        const res: any = input.map((i: any) => getInputState(i));
        res.inputState = new InputStateImpl(input);
        return res;
    }

    const keys = Object.keys(input);
    if(keys.length > 0){
        const res:any = {};
        keys.forEach(k => {
            const value: any = input[k];
            res[k] = getInputState(value);
        });

        const inputState = new InputStateImpl(input);
        res.inputState = inputState;
        return res;
    }

    throw 'Could not create inputstate from ' + JSON.stringify(input);
}

export function deriveFormState<T extends object>(input: T): FormState<T> {
    return observable(getInputState(input));
}

class InputStateImpl<TValue> {
    @observable value: TValue;
    @observable errors: string[] = [];
    @observable visible: boolean = true;
    @observable disabled: boolean = false;
    @observable dirty: boolean = false;
    @observable touched: boolean = false;
    @observable required: boolean = false;

    constructor(private _initValue: TValue) {
        runInAction(() => {
            this.value = _initValue;
        })
    }
    
    @action setErrors(errors: string[]) {
        this.errors = errors;
    }

    @action setVisibility(visible: boolean) {
        this.visible = visible;
    }

    @action setDisabled(disabled: boolean) {
        this.disabled = disabled;
    }

    @action setRequired(required: boolean) {
        this.required = required;
    }

    protected _onUpdate: (state: InputStateImpl<TValue>) => any;

    @action public onUpdate = (handler: (state: InputStateImpl<TValue>) => any) => {
        this._onUpdate = handler;
        return this;
    }

    @action protected executeOnUpdate = () => {
        this._onUpdate && this._onUpdate(this);
    }

    /**
        * Allows you to take actions in your code based on `value` changes caused by user interactions
    */
    protected _onDidChange: (config: { newValue: TValue, oldValue: TValue }) => any;

    @action public onDidChange = (handler: (config: { newValue: TValue, oldValue: TValue }) => any) => {
        this._onDidChange = handler;
        return this;
    }

    @action protected executeOnDidChange = (config: { newValue: TValue, oldValue: TValue }) => {
        this._onDidChange && this._onDidChange(config);
    }

    /** On change on the component side */
    @action
    onChange = (value: TValue) => {
        // Store local old value for onDidChange
        const oldValue = this.value;
        // Immediately set for local ui binding
        this.value = value;

        // Call on did change if any
        this.executeOnDidChange({ newValue: value, oldValue });

        this.dirty = true;
        this.executeOnUpdate();
    }
}