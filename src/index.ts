import { KxxTransformer, KxxRecord, LineSplit, RecordMerger, RecordParser } from "kxx-reader-core";

export { KxxRecord, KxxRecordBalance } from "kxx-reader-core";

class KxxTransformerInstance<I, O> implements Transformer<I, O>{

  controller: TransformStreamDefaultController<O>;

  constructor(private transformer: KxxTransformer<I, O>) {

  }
  start(controller: TransformStreamDefaultController<O>) {
    return this.transformer.start(
      (chunk: O) => controller.enqueue(chunk),
      (warning: string) => { }
    );
  }

  transform(chunk: I, controller: TransformStreamDefaultController<O>) {
    return this.transformer.transform(chunk);
  }

  flush(controller: TransformStreamDefaultController<O>) {
    return this.transformer.flush();
  }

}

export function kxxreader() {

  const transformStreams = {
    lineSplit: new TransformStream<string, string>(new KxxTransformerInstance(new LineSplit())),
    recordMerger: new TransformStream<string, string[]>(new KxxTransformerInstance(new RecordMerger())),
    recordParser: new TransformStream<string[], KxxRecord>(new KxxTransformerInstance(new RecordParser()))
  }

  transformStreams.lineSplit.readable
    .pipeThrough(transformStreams.recordMerger)
    .pipeTo(transformStreams.recordParser.writable);

  return {
    writable: transformStreams.lineSplit.writable,
    readable: transformStreams.recordParser.readable
  };

}

