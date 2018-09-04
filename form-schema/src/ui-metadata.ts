export abstract class UIType {}

export class TextField extends UIType {
    readonly tag: string = 'UI:TextField';
    public static is(instance: any): instance is TextField {
        return instance && instance.tag === 'UI:TextField';
    }
}

export class Checkbox extends UIType {
    readonly tag: string = 'UI:Checkbox';
    public static is(instance: any): instance is Checkbox {
        return instance && instance.tag === 'UI:Checkbox';
    }
}

export type KeyValuePair = {
    key: string;
    value: string;
}

export class SelectList extends UIType {
    readonly tag: string = 'UI:SelectList';
    public static is(instance: any): instance is SelectList {
        return instance && instance.tag === 'UI:SelectList';
    }

    constructor(public data: Promise<KeyValuePair[]>) {
        super();
    }
}

export const select = (data: Promise<KeyValuePair[]>) => new SelectList(data);

interface PresentationOptions<PropertyType> {
    displayName?: string;
    readonly?: boolean;
    autofocus?: boolean;
    type?: UIType;
};

type PropertyPresentationMap<T> = {
    [P in keyof T]?: PresentationOptions<T[P]>;
};

type EntityPresentation<T> = {
    displayName?: string;
    presentation?: PropertyPresentationMap<T>;
}