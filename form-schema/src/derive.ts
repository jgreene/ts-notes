import * as schema from './types'
import 'reflect-metadata'

function getTarget(target:any): any {
    return target.prototype === undefined ? target.constructor : target;
}

export function Entity(constructor: Function) {
    //console.log(constructor);
}

export function Field() {
    return function(target: any, propertyKey: string) {
        //console.log(arguments);
    }
}

const get_schema_for_value = (target: any, key: string, ): schema.FormGroupSchema | schema.UIField => {
    const value = target[key];
    if(typeof value === "string" || value instanceof String) {
        return new schema.UIField(key, new schema.StringType(), false, new schema.TextField());
    }

    if(typeof value === "number" || value instanceof Number) {
        return new schema.UIField(key, new schema.NumberType(), false, new schema.TextField());
    }

    if(typeof value === "boolean" || value instanceof Boolean) {
        return new schema.UIField(key, new schema.BooleanType(), false, new schema.CheckboxField());
    }

    return deriveFormSchema(value);
}


export function deriveFormSchema(target: any) : schema.FormGroupSchema {
    const names = Object.getOwnPropertyNames(target);
    var children = names.map(key => {
        //var t = Reflect.getMetadata("design:type", target, key);
        return get_schema_for_value(target, key);
    });

    const name = target.constructor.name.toString();

    return new schema.FormGroupSchema(name, children);
}