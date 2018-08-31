import { observe, autorun, observable, action, runInAction, computed } from 'mobx';

export type RecordState = {
    errors: string[];
    visible: boolean;
    disabled: boolean;
    dirty: boolean;
    touched: boolean;
    required: boolean;
    path: string;

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
                    T[P] extends Array<infer U> ? InputState<FormStateType<U>[]> :
                    T[P] extends Function ? never :
                    FormState<T[P]>;
}

export type ModelState<T> = {
    [P in keyof T]: T[P];
}

interface IFormModel<T> {
    getFormModel(): ModelState<T>;
}

export type FormState<T> = FormStateType<T> & IInputState & IFormModel<T>

export type Constructor<T = {}> = new (...args: any[]) => T;

function getInputState(input: any, parent: any = null, path: string = ''): any
{
    if(typeof input === "string")
    {
        return getInputStateImpl(input, parent, path) as any;
    }

    if(typeof input === "boolean")
    {
        return getInputStateImpl(input, parent, path) as any;
    }

    if(typeof input === "number")
    {
        return getInputStateImpl(input, parent, path) as any;
    }
    
    if(input === null)
    {
        return getInputStateImpl(input, parent, path) as any;
    }

    if(input instanceof Array || Array.isArray(input))
    {
        const res: any = input.map((entry: any, i: number) => getInputState(entry, input, path + '.value[' + i + ']'));
        return getInputStateImpl(res, parent, path) as any;
    }

    const keys = Object.keys(input);
    if(keys.length > 0){
        const res:any = {};
        keys.forEach(k => {
            const value: any = input[k];
            res[k] = getInputState(value, res, path + '.' + k);
        });

        const inputState = getInputStateImpl(input, parent, path) as any;
        res.inputState = inputState;
        res.getFormModel = function() { return getFormModel(this); }
        return res;
    }

    throw 'Could not create inputstate from ' + JSON.stringify(input);
}

export function deriveFormState<T extends object>(input: T): FormState<T> {
    return getInputState(input);
}

function getInputModel(input: any): any {
    if(input instanceof Array || Array.isArray(input)){
        return input.map((i: any) => getInputModel(i));
    }

    if(input.isInputStateImpl){
        return input.value;
    }

    const keys = Object.keys(input);
    if(keys.length > 0){
        const res:any = {};
        keys.forEach(k => {
            if(k !== 'inputState' && k !== 'getFormModel'){
                const value: any = input[k];
                res[k] = getInputModel(value);
            }
        });

        return res;
    }

    throw 'Could not create input model from ' + JSON.stringify(input);
}

export function getFormModel<T>(state: FormState<T>): ModelState<T> {
    return getInputModel(state);
}

function getInputStateImpl<T>(input: T, parent: any, path: string): InputState<T> {
    var errors: string[] = [];
    var res = {
        isInputStateImpl: true,
        value: input,
        errors: errors,
        visible: false,
        disabled: false,
        dirty: false,
        touched: false,
        required: false,
        path: path,

        setErrors(errors: string[]) {
            runInAction(() => {
                this.errors = errors;
            })
            
        },
        setVisibility(visible: boolean) {
            runInAction(() => {
                this.visible = visible;
            });
        },

        setDisabled(disabled: boolean) {
            runInAction(() => {
                this.disabled = disabled;
            });
        },
    
        setRequired(required: boolean) {
            runInAction(() => {
                this.required = required;
            });
        },
    
        /** On change on the component side */
        onChange(value: T) {
            runInAction(() => {
            // Store local old value for onDidChange
                const oldValue = this.value;
                // Immediately set for local ui binding
                this.value = value;
        
                this.dirty = true;
            });
        }
    }
    return res;
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