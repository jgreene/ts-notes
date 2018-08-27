import { observable, action, runInAction } from 'mobx';

export class FieldState<TValue> {
    @observable value: TValue;
    @observable errors: string[] = [];
    @observable visible: boolean = true;
    @observable disabled: boolean = false;
    @observable dirty: boolean = false;
    @observable touched: boolean = false;

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

    protected _onUpdate: (state: FieldState<TValue>) => any;

    @action public onUpdate = (handler: (state: FieldState<TValue>) => any) => {
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

export class FormState<TValue> {
    
}