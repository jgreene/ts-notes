import { observe, autorun, observable, action, runInAction, computed, reaction, extendObservable, intercept } from 'mobx';

import { validate, ValidationResult } from './validation'

type primitive = string | number | boolean | null | undefined;

function isPrimitive(input: any): input is primitive {
    return typeof input === "string"
        || typeof input === "boolean"
        || typeof input === "number"
        || input === null
        || input === undefined;
}

export type InputState<TValue> = {
    value: TValue;
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
    setRequired(required: boolean): void;
    onChange(newValue: TValue): void;
};

function isInputState(input: any): input is InputState<any> {
    return input.isInputStateImpl;
}

export type FormStateType<T> = {
    [P in keyof T]: T[P] extends Function ? never :
                    T[P] extends primitive ? InputState<T[P]> :
                    T[P] extends Array<infer U> ? U extends primitive ? InputState<InputState<U>[]> : InputState<FormState<U>[]> :
                    InputState<FormStateType<T[P]>>;
}

export type ModelState<T> = {
    [P in keyof T]: T[P] extends Function ? never :
                    T[P] extends primitive ? T[P] :
                    T[P] extends Array<infer U> ? U extends primitive ? U[] : ModelState<U>[] :
                    ModelState<T[P]>
}

interface IFormModel<T> {
    readonly model: T;
}

export type FormState<T> = InputState<FormStateType<T>> & IFormModel<T>

export type Constructor<T = {}> = new (...args: any[]) => T;

function getInputState(input: any, fireChange: Function, parent: any = null, path: string = ''): any
{
    if(isPrimitive(input))
    {
        return getInputStateImpl(input, fireChange, parent, path) as any;
    }

    if(input instanceof Array || Array.isArray(input))
    {
        const res: any = input.map((entry: any, i: number) => getInputState(entry, fireChange, input, path + '[' + i + ']'));
        return getInputStateImpl(res, fireChange, parent, path) as any;
    }

    const keys = Object.keys(input);
    if(keys.length > 0){
        const record:any = {};
        keys.forEach(k => {
            const value: any = input[k];
            record[k] = getInputState(value, fireChange, record, path + '.' + k);
        });

        return getInputStateImpl(record, fireChange, parent, path) as any;
    }

    throw 'Could not create inputstate from ' + JSON.stringify(input);
}

function applyErrorsToFormState(result: any, input: InputState<any>) {
    if(Array.isArray(result)){
        if(Array.isArray((result as any).errors)){
            input.setErrors((result as any).errors);
            result.forEach((r, i) => {
                applyErrorsToFormState(r, input.value[i]);
            });
            return;
        } else {
            input.setErrors(result);
            return;
        }
    }

    let keys = Object.keys(result);
    if(keys.length > 0){
        keys.forEach(k => {
            const value = result[k];
            const formInput = input.value[k];
            
            applyErrorsToFormState(value, formInput);
        });
    }
}

export function deriveFormState<T>(input: T): FormState<T> {
    const runValidation = function(current: InputState<any>, form: FormState<T>): void {
        validate(form.model as any, current.path).then(result => {
            applyErrorsToFormState(result, form);
        });
    };

    var getFormState: () => FormState<T> | undefined = () => undefined;
    const trigger = (current: InputState<any>) => {
        let form = getFormState();
        if(form !== undefined)
        {
            runValidation(current, form);
        }
    };

    const state = getInputState(input, trigger);
    const obs = observable(state);
    extendObservable(obs, {
        get model(): T { return new (input as any).constructor(getFormModel<T>(this as any) as any); },
    });

    getFormState = () => obs;
    
    return obs;
}

function getInputModel(input: any): any {
    if(isPrimitive(input))
    {
        return input;
    }

    if(isInputState(input)){
        return getInputModel(input.value);
    }

    if(input instanceof Array || Array.isArray(input)){
        return input.map((i: any) => getInputModel(i));
    }

    const keys = Object.keys(input);
    if(keys.length > 0){
        const res:any = {};
        keys.forEach(k => {
            const value: any = input[k];
            res[k] = getInputModel(value);
        });

        return res;
    }

    throw 'Could not create input model from ' + JSON.stringify(input);
}

export function getFormModel<T>(state: FormState<T>): ModelState<T> {
    return getInputModel(state);
}

function getInputStateImpl<T>(input: T, fireChange: Function, parent: any, path: string): InputState<T> {
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

                fireChange(this);
            });
        }
    }
    return res;
}
