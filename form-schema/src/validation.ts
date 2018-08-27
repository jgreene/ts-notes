
import 'reflect-metadata'

type ValidatorResult = string | null | Promise<string | null>;

const VALIDATION_METADATA_KEY = "VALIDATION_METADATA_KEY";

type ValidationModel<T> = {
    [P in keyof T]?: (model: T) => ValidatorResult | Array<(model: T) => ValidatorResult>;
}

type ValidatorEntryProps<T> = {
    [P in keyof T]?: Array<(model: T) => ValidatorResult>;
}

function getValidatorsFor<T>(klass: new (...args: any[]) => T) : ValidatorEntryProps<T> {
    return Reflect.getMetadata(VALIDATION_METADATA_KEY, klass) as ValidatorEntryProps<T> || {};
}

export function register<T>(
    klass: new (...args: any[]) => T,
    map: ValidationModel<T>
): void  {
    const currentMap = getValidatorsFor<T>(klass);
    for(const prop in map) {
        const currentValidators = (currentMap[prop] || []) as Array<(model: T) => ValidatorResult>;
        const mapped = map[prop];
        if(mapped instanceof Array){
            mapped.forEach(m => {
                currentValidators.push(m);
            });
        }
        else {
            currentValidators.push(mapped as any);
        }

        currentMap[prop] = currentValidators;
    }

    Reflect.defineMetadata(VALIDATION_METADATA_KEY, currentMap, klass);
}

type ValidationArray<T> = Array<T> & {
    errors: string[]
}

export type ValidationResult<T> = {
    [P in keyof T]?: T[P] extends string ? string[] :
                     T[P] extends number ? string[] :
                     T[P] extends boolean ? string[] :
                     T[P] extends undefined ? string[] :
                     T[P] extends Array<infer U> ? ValidationArray<ValidationResult<U>> :
                     ValidationResult<T[P]>;
}

export async function validate<T>(model: T): Promise<ValidationResult<T>> {
    var target = model as any;
    target = target.prototype === undefined ? target.constructor : target;
    
    const result: any = {};
    const add = (key: string, res: string | null) => {
        if(res === null)
            return;
        var current = result[key] || [];
        current.push(res);
        result[key] = current;
    };

    const addToArray = (key: string, res: string | null) => {
        if(res === null)
            return;
        
        var current: any = result[key] || [];
        if(!current.errors)
        {
            current.errors = [];
        }

        current.errors.push(res);
        result[key] = current;
    }

    const containsKey = (key: string) => {
        return !!result[key];
    };

    const validators = getValidatorsFor<T>(target);

    for(const key in validators){
        const propValue = model[key];
        const isArray = propValue instanceof Array;
        const propValidators = validators[key] as Array<(model: T) => ValidatorResult>;
        for(var i = 0; i < propValidators.length; i++){
            const v = propValidators[i];
            var res = v(model);
            if(res instanceof Promise){
                res = await res;
            }
            if(isArray){
                addToArray(key, res);
            }else {
                add(key, res);
            }
        }
    }

    for(const prop in model) {
        const propValue = model[prop];
        if(propValue instanceof Array) {
            var arrayRes: any = result[prop] || [];
            for(var k = 0; k < propValue.length; k++){
                const item = propValue[k];
                const innerResult = await validate(item);
                if(Object.keys(innerResult).length > 0){
                    arrayRes.push(innerResult);
                }
            }

            if(arrayRes.length > 0){
                if(!arrayRes.errors){
                    arrayRes.errors = [];
                };
                result[prop] = arrayRes;
            }
        }
        else if(propValue.constructor) {
            const innerResult = await validate(propValue);
            if(Object.keys(innerResult).length > 0)
            {
                const current = result[prop];
                if(current){
                    result[prop] = Object.assign(current, innerResult);
                }
                else {
                    result[prop] = innerResult;
                }
            }
        }
    }

    return result;
}