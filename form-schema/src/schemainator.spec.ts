import { expect } from 'chai';
import 'mocha';

import { IPerson, PersonType } from './schemainator'

describe('PersonType', () => {
    it('Can get properties', async () => {
        console.log(PersonType);

        PersonType.props
        console.log(PersonType.name);
    });

})