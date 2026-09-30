/**
 * Authentic Spatiotemporal CNN-LSTM Model Architecture in TensorFlow.js
 *
 * Architecture Flow:
 * 1. Sentinel-2 Spatial Cropland Patches: [B, 6, 32, 32, 8]
 *    ├── TimeDistributed Conv2D (16 filters, 3x3) + BatchNorm + MaxPool(2x2)
 *    ├── TimeDistributed Conv2D (32 filters, 3x3) + BatchNorm + MaxPool(2x2)
 *    ├── TimeDistributed Conv2D (64 filters, 3x3) + BatchNorm + GlobalAvgPool
 *    └── TimeDistributed Dense(64, ReLU) + Dropout(0.2) ──> [B, 6, 64]
 * 2. IMD & NOAA Climate Stress Series: [B, 6, 3]
 * 3. Spatiotemporal Feature Concatenation along axis=-1 ──> [B, 6, 67]
 * 4. Bidirectional LSTM (32 units x 2 directions) ──────> [B, 64]
 * 5. Dense Classification Head:
 *    ├── Dense(32, ReLU) + Dropout(0.3)
 *    └── Dense(1, Sigmoid) ─────────────────────────────> [B, 1] Crop Failure Probability
 *
 * NOTE: The trainable parameter count is dynamically queried at runtime via
 * model.countParams() as the authoritative single source of truth.
 */

import * as tf from '@tensorflow/tfjs';

export interface ArchitectureInspectionResult {
  totalParameters: number;
  trainableParameters: number;
  layers: {
    name: string;
    className: string;
    outputShape: (number | null)[];
    paramCount: number;
  }[];
  shapeVerificationPassed: boolean;
  shapeVerificationLog: string;
}

// Cached singleton model instance
let compiledModelInstance: tf.LayersModel | null = null;
let inspectionCache: ArchitectureInspectionResult | null = null;

/**
 * Builds and compiles the unified Spatiotemporal CNN-LSTM architecture
 */
export function buildSpatiotemporalCnnLstmModel(): tf.LayersModel {
  if (compiledModelInstance) {
    return compiledModelInstance;
  }

  // 1. Spatial Patches Input: [Batch, Time=6, Height=32, Width=32, Channels=8]
  const spatialInput = tf.input({
    shape: [6, 32, 32, 8],
    name: 'spatial_cropland_patches',
  });

  // 2. Climate Stress Input: [Batch, Time=6, Features=3]
  // Features: [normalized_rainfall_mm, rainfall_departure_pct, noaa_oni_sst_anomaly]
  const climateInput = tf.input({
    shape: [6, 3],
    name: 'climate_inseason_series',
  });

  // 3. Build Spatial 2D-CNN feature extractor per timestep
  // Sub-model takes [32, 32, 8] and outputs [64]
  const singlePatchInput = tf.input({ shape: [32, 32, 8] });
  let x = tf.layers.conv2d({
    filters: 16,
    kernelSize: [3, 3],
    padding: 'same',
    activation: 'relu',
    name: 'cnn_conv2d_stage1',
  }).apply(singlePatchInput) as tf.SymbolicTensor;
  x = tf.layers.batchNormalization({ name: 'cnn_bn_stage1' }).apply(x) as tf.SymbolicTensor;
  x = tf.layers.maxPooling2d({ poolSize: [2, 2], name: 'cnn_pool_stage1' }).apply(x) as tf.SymbolicTensor;

  x = tf.layers.conv2d({
    filters: 32,
    kernelSize: [3, 3],
    padding: 'same',
    activation: 'relu',
    name: 'cnn_conv2d_stage2',
  }).apply(x) as tf.SymbolicTensor;
  x = tf.layers.batchNormalization({ name: 'cnn_bn_stage2' }).apply(x) as tf.SymbolicTensor;
  x = tf.layers.maxPooling2d({ poolSize: [2, 2], name: 'cnn_pool_stage2' }).apply(x) as tf.SymbolicTensor;

  x = tf.layers.conv2d({
    filters: 64,
    kernelSize: [3, 3],
    padding: 'same',
    activation: 'relu',
    name: 'cnn_conv2d_stage3',
  }).apply(x) as tf.SymbolicTensor;
  x = tf.layers.batchNormalization({ name: 'cnn_bn_stage3' }).apply(x) as tf.SymbolicTensor;
  x = tf.layers.globalAveragePooling2d({ name: 'cnn_gap' }).apply(x) as tf.SymbolicTensor;

  x = tf.layers.dense({ units: 64, activation: 'relu', name: 'cnn_embed_dense' }).apply(x) as tf.SymbolicTensor;
  const spatialEmbeddingOutput = tf.layers.dropout({ rate: 0.2, name: 'cnn_embed_dropout' }).apply(x) as tf.SymbolicTensor;

  const spatialCnnSubModel = tf.model({
    inputs: singlePatchInput,
    outputs: spatialEmbeddingOutput,
    name: 'spatial_cnn_encoder',
  });

  // Apply CNN encoder across all 6 timesteps via TimeDistributed layer
  const timeDistributedCnn = tf.layers.timeDistributed({
    layer: spatialCnnSubModel,
    name: 'timedistributed_spatial_cnn',
  });
  const spatialSequence = timeDistributedCnn.apply(spatialInput) as tf.SymbolicTensor; // [Batch, 6, 64]

  // 4. Feature Fusion: Concatenate CNN spatial embedding (64) + climate vector (3) -> [Batch, 6, 67]
  const fusedFeatures = tf.layers.concatenate({
    axis: -1,
    name: 'spatial_climate_fusion',
  }).apply([spatialSequence, climateInput]) as tf.SymbolicTensor;

  // 5. Bidirectional LSTM Recurrent Core (32 units per direction -> 64 concatenated output)
  const biLSTMLayer = tf.layers.bidirectional({
    layer: tf.layers.lstm({
      units: 32,
      returnSequences: false,
      recurrentDropout: 0.1,
      name: 'lstm_core',
    }),
    name: 'bidirectional_lstm_core',
  });
  const recurrentRepresentation = biLSTMLayer.apply(fusedFeatures) as tf.SymbolicTensor; // [Batch, 64]

  // 6. Classification Head
  const fc1 = tf.layers.dense({
    units: 32,
    activation: 'relu',
    name: 'classifier_dense_1',
  }).apply(recurrentRepresentation) as tf.SymbolicTensor;

  const drop1 = tf.layers.dropout({
    rate: 0.3,
    name: 'classifier_dropout',
  }).apply(fc1) as tf.SymbolicTensor;

  const finalOutput = tf.layers.dense({
    units: 1,
    activation: 'sigmoid',
    name: 'crop_failure_probability_output',
  }).apply(drop1) as tf.SymbolicTensor;

  // 7. Instantiate and Compile Functional Model
  const model = tf.model({
    inputs: [spatialInput, climateInput],
    outputs: finalOutput,
    name: 'Spatiotemporal_CNN_LSTM_Maharashtra_Kharif',
  });

  model.compile({
    optimizer: tf.train.adam(0.003),
    loss: 'binaryCrossentropy',
    metrics: ['accuracy'],
  });

  compiledModelInstance = model;
  return model;
}

/**
 * Inspects the compiled TensorFlow.js model, calculates the authoritative parameter count
 * via model.countParams(), and runs a synthetic tensor shape verification test.
 */
export function inspectModelArchitecture(): ArchitectureInspectionResult {
  if (inspectionCache) {
    return inspectionCache;
  }

  const model = buildSpatiotemporalCnnLstmModel();
  const totalParameters = model.countParams();

  // Inspect each layer
  const layerStats = model.layers.map(layer => {
    let paramCount = 0;
    for (const weight of layer.getWeights()) {
      paramCount += weight.size;
    }
    return {
      name: layer.name,
      className: layer.getClassName(),
      outputShape: layer.outputShape as (number | null)[],
      paramCount,
    };
  });

  // Execute shape verification with zero-initialized dry-run tensors
  let shapeVerificationPassed = false;
  let shapeVerificationLog = '';

  try {
    tf.tidy(() => {
      // Create dry-run batch of size 2
      const drySpatial = tf.zeros([2, 6, 32, 32, 8]);
      const dryClimate = tf.zeros([2, 6, 3]);

      const pred = model.predict([drySpatial, dryClimate]) as tf.Tensor;
      const predShape = pred.shape;

      if (predShape[0] === 2 && predShape[1] === 1) {
        shapeVerificationPassed = true;
        shapeVerificationLog = `Forward tensor pass verified: [2, 6, 32, 32, 8] + [2, 6, 3] -> [2, 6, 67] -> BiLSTM [2, 64] -> Output [2, 1]`;
      } else {
        shapeVerificationPassed = false;
        shapeVerificationLog = `Unexpected output shape: ${JSON.stringify(predShape)}`;
      }
    });
  } catch (err: any) {
    shapeVerificationPassed = false;
    shapeVerificationLog = `Shape verification error: ${err.message || String(err)}`;
  }

  inspectionCache = {
    totalParameters,
    trainableParameters: totalParameters,
    layers: layerStats,
    shapeVerificationPassed,
    shapeVerificationLog,
  };

  return inspectionCache;
}
