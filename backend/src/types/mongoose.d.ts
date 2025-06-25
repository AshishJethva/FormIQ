import { Document, Model, Query } from 'mongoose';

declare module 'mongoose' {
  interface Query<ResultType, DocType extends Document, THelpers = {}>
    extends Promise<ResultType> {
    select(projection?: any | null): Query<ResultType, DocType>;
    sort(arg?: any): Query<ResultType, DocType>;
    populate(path: string, select?: string): Query<ResultType, DocType>;
    limit(val: number): Query<ResultType, DocType>;
    skip(val: number): Query<ResultType, DocType>;
    lean(val?: boolean): Query<ResultType, DocType>;
    exec(): Promise<ResultType>;
  }
}
