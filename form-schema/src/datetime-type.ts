import * as t from 'io-ts'
import moment from 'moment';

export const DateTime = new t.Type<moment.Moment>(
    'DateTime',
    (mixed: any): mixed is moment.Moment => moment.isMoment(mixed),
    (mixed: any, context: any) => {
      if(typeof mixed === "string"){
        const instance = moment(mixed);
        return instance.isValid() ? t.success(instance) : t.failure(mixed, context)
      }
      else if(moment.isMoment(mixed)) {
        const instance: moment.Moment = mixed as moment.Moment;
        return instance.isValid() ? t.success(instance) : t.failure(mixed, context)
      }
      return t.failure(mixed, context);
    },
    instance => instance
  )
  
  export type DateTime = moment.Moment