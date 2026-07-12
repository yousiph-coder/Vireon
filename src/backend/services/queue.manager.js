import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

export class QueueManager {
  constructor() {
    this.useRedis = false;
    this.redisConfig = {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      maxRetriesPerRequest: null,
      connectTimeout: 2000 // 2 seconds timeout to check if Redis is up
    };

    this.queues = {};
    this.inMemoryQueues = {};
    this.inMemoryWorkers = {};
  }

  /**
   * تهيئة اتصالات الطوابير والتحقق من توافر Redis
   */
  async initialize() {
    let testRedis = null;
    try {
      console.log(`[QueueManager] Checking Redis connection on ${this.redisConfig.host}:${this.redisConfig.port}...`);
      testRedis = new IORedis({
        ...this.redisConfig,
        connectTimeout: 1000,
        lazyConnect: true,
        retryStrategy: () => null // منع محاولة الاتصال التلقائي اللانهائي في حال الفشل
      });
      await testRedis.connect();
      testRedis.disconnect();
      this.useRedis = true;
      console.log('[QueueManager] Redis is available. Using BullMQ queues. ✅');
    } catch (err) {
      console.warn('[QueueManager] Redis connection failed. Falling back to In-Memory Queue processing. ⚠️');
      this.useRedis = false;
      if (testRedis) {
        try { testRedis.disconnect(); } catch (_) {}
      }
    }

    // تهيئة الطوابير الأربعة
    const queueNames = ['UploadQueue', 'WhisperQueue', 'GeminiQueue', 'ExportQueue'];
    for (const name of queueNames) {
      if (this.useRedis) {
        const connection = new IORedis(this.redisConfig);
        this.queues[name] = new Queue(name, { connection });
      } else {
        this.inMemoryQueues[name] = {
          jobs: [],
          processing: false
        };
      }
    }
  }

  /**
   * إضافة مهمة جديدة للطابور
   * @param {string} queueName - اسم الطابور
   * @param {string} jobName - اسم المهمة
   * @param {Object} data - البيانات المرسلة للمهمة
   */
  async addJob(queueName, jobName, data) {
    const jobId = `${queueName}_job_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    if (this.useRedis) {
      const q = this.queues[queueName];
      if (q) {
        await q.add(jobName, data, { jobId });
        return jobId;
      }
    }

    // معالجة الذاكرة المحلية (In-Memory)
    const inMemQ = this.inMemoryQueues[queueName];
    if (inMemQ) {
      const job = { id: jobId, name: jobName, data, status: 'queued', progress: 0 };
      inMemQ.jobs.push(job);
      console.log(`[QueueManager][InMemory] Job ${jobId} added to ${queueName}`);
      
      // إطلاق المعالج فوراً في الخلفية
      this._processInMemoryQueue(queueName);
      return jobId;
    }
    throw new Error(`Queue ${queueName} not initialized.`);
  }

  /**
   * تسجيل معالج (Worker) لطابور معين
   * @param {string} queueName - اسم الطابور
   * @param {Function} handler - الدالة المسؤولة عن معالجة المهمة
   */
  registerWorker(queueName, handler) {
    if (this.useRedis) {
      const connection = new IORedis(this.redisConfig);
      const worker = new Worker(queueName, async (job) => {
        console.log(`[QueueManager][BullMQ] Processing job ${job.id} in queue ${queueName}`);
        return await handler(job);
      }, { connection });

      worker.on('failed', (job, err) => {
        console.error(`[QueueManager][BullMQ] Job ${job.id} failed in queue ${queueName}:`, err.message);
      });
      return worker;
    }

    // تسجيل المعالج في الذاكرة
    this.inMemoryWorkers[queueName] = handler;
    console.log(`[QueueManager][InMemory] Registered worker for ${queueName}`);
  }

  /**
   * معالجة الطابور الداخلي في الذاكرة
   */
  async _processInMemoryQueue(queueName) {
    const q = this.inMemoryQueues[queueName];
    const handler = this.inMemoryWorkers[queueName];

    if (!q || q.processing || q.jobs.length === 0 || !handler) {
      return;
    }

    q.processing = true;
    const job = q.jobs.shift();
    job.status = 'processing';
    console.log(`[QueueManager][InMemory] Starting job ${job.id} in ${queueName}`);

    try {
      const result = await handler(job);
      job.status = 'completed';
      job.result = result;
      console.log(`[QueueManager][InMemory] Completed job ${job.id} in ${queueName}`);
    } catch (err) {
      job.status = 'failed';
      job.error = err.message;
      console.error(`[QueueManager][InMemory] Job ${job.id} failed in ${queueName}:`, err.message);
    } finally {
      q.processing = false;
      // متابعة معالجة المهام التالية
      this._processInMemoryQueue(queueName);
    }
  }
}
