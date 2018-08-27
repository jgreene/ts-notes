import { observable } from 'mobx'
import { observer } from 'mobx-react'
import * as React from 'react'
import { FormState, FieldState } from 'formstate'
import * as schema from './types'

import { FormGroup, FormLabel, TextField, Typography } from '@material-ui/core';

const get_default_value = (field: schema.UIField) => {
    return '';
};

const get_ui_field = (field: schema.UIField) => {
    var value = get_default_value(field);
    var fieldState = new FieldState<any>(value);
    return fieldState;
}

const get_schema_state = (child: schema.FormGroupSchema | schema.UIField) => {
    if(child instanceof schema.FormGroupSchema){
        var children: any = {};
        child.children.forEach(c => {
            children[c.name] = get_schema_state(c);
        });

        return new FormState(children);
    }

    return get_ui_field(child);
}

const get_dynamic_form_state = (form_group: schema.FormGroupSchema) => {
    return get_schema_state(form_group) as FormState<any>;
}

export class DynamicFormState {
    public form: FormState<any>
    constructor(
        public form_schema: schema.FormGroupSchema
    ){
        this.form = get_dynamic_form_state(form_schema);
    }

    validate = async () => {
        return this.form.validate();
    }

    onSubmit = async () => {
        console.log(this.form);
    }
}

type DynamicFieldProps = {
    schema: schema.UIField,
    state: FieldState<any>
}

@observer
export class DynamicField extends React.Component<DynamicFieldProps, {}> {
    onChange(e: any): void {
        if(e && e.target){
            this.props.state.onChange(e.target.value);
        }
    }

    get_element() {
        const ui_type = this.props.schema.ui_type;
        const isDisabled = this.props.schema.status !== undefined && this.props.schema.status instanceof schema.DisabledStatus;
        if(ui_type instanceof schema.TextField) {
            return (<TextField 
                        disabled={isDisabled}
                        label={this.props.schema.name} 
                        value={this.props.state.value === null ? '' : this.props.state.value} 
                        onChange={this.onChange} />
                    );
        }

        return null;
    }

    render() {
        return this.get_element();
    }
}

type DynamicFormGroupProps = {
    schema: schema.FormGroupSchema
    form_state: FormState<any>
}

@observer
export class DynamicFormGroup extends React.Component<DynamicFormGroupProps, {}> {

    get_field_state(name: string): FieldState<any> {
        return this.props.form_state.$[name] as FieldState<any>;
    }

    get_form_state(name: string): FormState<any> {
        return this.props.form_state.$[name] as FormState<any>;
    }

    render() {
        const children: any = this.props.schema.children.map(child => {
            if(child instanceof schema.FormGroupSchema){
                return (<DynamicFormGroup key={child.name} schema={child} form_state={this.get_form_state(child.name)} />);
            }

            return (<DynamicField key={child.name} schema={child} state={this.get_field_state(child.name) } />);
        });

        const label = this.props.schema.name && this.props.schema.name.length > 0 ? (
            <Typography variant="title" gutterBottom>
                    {this.props.schema.name}
            </Typography>
        ) : null;

        return (
            <FormGroup>
                {label}
                
                {children}
            </FormGroup>
        )
    }
}


type DynamicFormProps = {
    schema: schema.FormGroupSchema,
    onSubmit?: (_: DynamicFormState) => void
}

@observer
export class DynamicForm extends React.Component<DynamicFormProps, {}> {
    data = new DynamicFormState(this.props.schema)
    render() {
        const data = this.data;
        return (
            <form onSubmit={data.onSubmit} noValidate>
                <DynamicFormGroup schema={data.form_schema} form_state={data.form} />
            </form>
        );
    }
}