import {
    CreateOptions, FlattenMaps, HydratedDocument,
    Model, MongooseUpdateQueryOptions, PopulateOptions, ProjectionType, QueryOptions,
    RootFilterQuery, UpdateQuery,
    UpdateWriteOpResult
} from "mongoose";

export type Lean<T>=HydratedDocument<FlattenMaps<T>>
export abstract class  DatabaseRepository<TDocument>{

    constructor(protected readonly model: Model<TDocument>) { }
      async findOneAndUpdate({
  filter,
  update,
  options,
}: {
  filter: RootFilterQuery<TDocument>;
  update: UpdateQuery<TDocument>;
  options?: (QueryOptions<TDocument> & { new?: boolean }) | null;
}): Promise<HydratedDocument<TDocument> | Lean<TDocument> | null> {
  let doc = this.model.findOneAndUpdate(filter, update, options || { new: true });

  if (options?.populate) {
    doc = doc.populate(options.populate as PopulateOptions[]);
  }

  if (options?.lean) {
    doc.lean(options.lean);
  }

  return await doc.exec();
}


     async updateOne({
    filter,
    update,
    
  }: {
    filter: RootFilterQuery<TDocument>;
    update: UpdateQuery<TDocument>;
    options?: QueryOptions<TDocument>;
         }) {
         
      return await this.model.updateOne(filter, update );
  }
   
    async findOne({ filter, select ,options}: {
        filter?: RootFilterQuery<TDocument> ,
        select?: ProjectionType<TDocument> | null,
        options?:QueryOptions<TDocument>|null
    }):Promise<Lean<TDocument>|HydratedDocument<TDocument>| null> {
        const doc =  this.model.findOne(filter).select(select || '')
        if (options?.populate) {
            doc.populate(options.populate as PopulateOptions[])
        }
        if (options?.lean) {
            doc.lean(options?.lean)
        }
        return await doc.exec()
    }

    async UpdateOne({ filter, update, options }: {
        filter: RootFilterQuery<TDocument>,
        update?: UpdateQuery<TDocument> | null,
        options?: MongooseUpdateQueryOptions<TDocument> | null
    }): Promise<UpdateWriteOpResult> {
        return await this.model.updateOne(
            filter,
            {
                ...update,
                $inc: { __v: 1 }
            },
            options)
    }


    async create({
        data,
        options }:
        {
        data: Partial<TDocument>[],
        options?: CreateOptions | undefined
    }): Promise<HydratedDocument<TDocument>[] | undefined>
    {
    
        return await this.model.create(data ,options)
    }


}