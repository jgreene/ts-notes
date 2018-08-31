import { observe, autorun, observable, action, runInAction, computed } from 'mobx';

export type InputState<TValue> = {
    value: TValue;
    onChange(newValue: TValue): void;
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

type primitive = string | number | boolean | null | undefined;

export type FormStateType<T> = {
    [P in keyof T]: T[P] extends Function ? never :
                    T[P] extends primitive ? InputState<T[P]> :
                    T[P] extends Array<infer U> ? U extends primitive ? InputState<InputState<U>[]> : InputState<FormState<U>[]> :
                    FormState<T[P]>;
}

export type ModelState<T> = {
    [P in keyof T]: T[P];
}

interface IFormModel<T> {
    getFormModel(): ModelState<T>;
}

export type FormState<T> = InputState<FormStateType<T>> & IFormModel<T>

export type Constructor<T = {}> = new (...args: any[]) => T;

function isPrimitive(input: any): input is primitive {
    return typeof input === "string"
        || typeof input === "boolean"
        || typeof input === "number"
        || input === null
        || input === undefined;
}

function getInputState(input: any, parent: any = null, path: string = ''): any
{
    if(isPrimitive(input))
    {
        return getInputStateImpl(input, parent, path) as any;
    }

    if(input instanceof Array || Array.isArray(input))
    {
        const res: any = input.map((entry: any, i: number) => getInputState(entry, input, path + '[' + i + ']'));
        return getInputStateImpl(res, parent, path) as any;
    }

    const keys = Object.keys(input);
    if(keys.length > 0){
        const record:any = {};
        keys.forEach(k => {
            const value: any = input[k];
            record[k] = getInputState(value, record, path + '.' + k);
        });

        const res = getInputStateImpl(record, parent, path) as any;
        res.getFormModel = function() { return getFormModel(this); }
        return res;
    }

    throw 'Could not create inputstate from ' + JSON.stringify(input);
}

export function deriveFormState<T extends object>(input: T): FormState<T> {
    const state = getInputState(input);
    const obs = observable(state);
    return obs;
}

function getInputModel(input: any): any {
    if(isPrimitive(input))
    {
        return input;
    }

    if(input.isInputStateImpl){
        return getInputModel(input.value);
    }

    if(input instanceof Array || Array.isArray(input)){
        return input.map((i: any) => getInputModel(i));
    }

    const keys = Object.keys(input);
    if(keys.length > 0){
        const res:any = {};
        keys.forEach(k => {
            if(k !== 'getFormModel'){
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
    const errors: string[] = [];
    const run = (func: () => void) => {
        runInAction(func);
    };

    const res = {
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
            run(() => {
                this.errors = errors;
            })
            
        },
        setVisibility(visible: boolean) {
            run(() => {
                this.visible = visible;
            });
        },

        setDisabled(disabled: boolean) {
            run(() => {
                this.disabled = disabled;
            });
        },
    
        setRequired(required: boolean) {
            run(() => {
                this.required = required;
            });
        },
    
        /** On change on the component side */
        onChange(value: T) {
            run(() => {
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
