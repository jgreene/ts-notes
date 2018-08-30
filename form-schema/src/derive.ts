import * as schema from './types'
import 'reflect-metadata'

import * as t from 'io-ts'
import * as tdc from 'io-ts-derive-class'

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

const get_schema_for_value = (key: string, type: t.Type<any>): schema.FormGroupSchema | schema.UIField | null => {
    const tag = (type as any)['_tag'];
    const tagContains = (search: string) => tag && tag.length > 0 ? tag.indexOf(search) != -1 : false;

    if(tag === "StringType"){
        return new schema.UIField(key, t.string, schema.TextField);
    }

    if(tag === "InterfaceType") {
        //return new schema.FormGroupSchema()
    }

    return null;
}


export function deriveFormSchema<T>(target: tdc.Constructor<tdc.ITyped<T>>) : schema.FormGroupSchema {
    let getType = (target as any).getType;
    if(!getType)
    {
        throw 'Cannot derive form schema from entity without type data!';
    }

    const type = getType() as t.InterfaceType<any>;
    if(!type)
    {
        throw 'Cannot derive form schema from entity without type data!';
    }

    const children = Object.keys(type.props).map((key: string) => {
        return get_schema_for_value(key, type.props[key]);
    }).filter((c:schema.FormGroupSchema | schema.UIField | null) => c !== null) as Array<schema.FormGroupSchema | schema.UIField>;

    return new schema.FormGroupSchema(target.name, children);
}