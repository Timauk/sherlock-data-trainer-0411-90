export const getDefaultModelJson = () => ({
  modelTopology: {
    class_name: "Sequential",
    config: {
      name: "sequential_1",
      layers: [
        {
          class_name: "Dense",
          config: {
            units: 256,
            activation: "relu",
            use_bias: true,
            kernelInitializer: "glorotNormal",
            biasInitializer: "zeros",
            kernelRegularizer: {
              class_name: "L1L2",
              config: { l1: 0, l2: 0.01 }
            },
            input_shape: [17]
          }
        },
        {
          class_name: "BatchNormalization",
          config: {
            axis: -1,
            momentum: 0.99,
            epsilon: 0.001,
            center: true,
            scale: true
          }
        },
        {
          class_name: "Dense",
          config: {
            units: 128,
            activation: "relu",
            use_bias: true,
            kernelInitializer: "glorotNormal",
            biasInitializer: "zeros",
            kernelRegularizer: {
              class_name: "L1L2",
              config: { l1: 0, l2: 0.01 }
            }
          }
        },
        {
          class_name: "BatchNormalization",
          config: {
            axis: -1,
            momentum: 0.99,
            epsilon: 0.001,
            center: true,
            scale: true
          }
        },
        {
          class_name: "Dense",
          config: {
            units: 15,
            activation: "sigmoid",
            use_bias: true,
            kernelInitializer: "glorotNormal",
            biasInitializer: "zeros"
          }
        }
      ]
    }
  },
  weightsManifest: [{
    paths: ["weights.bin"],
    weights: [
      { name: "dense_1/kernel", shape: [17, 256], dtype: "float32" },
      { name: "dense_1/bias", shape: [256], dtype: "float32" },
      { name: "batch_normalization_1/gamma", shape: [256], dtype: "float32" },
      { name: "batch_normalization_1/beta", shape: [256], dtype: "float32" },
      { name: "dense_2/kernel", shape: [256, 128], dtype: "float32" },
      { name: "dense_2/bias", shape: [128], dtype: "float32" },
      { name: "batch_normalization_2/gamma", shape: [128], dtype: "float32" },
      { name: "batch_normalization_2/beta", shape: [128], dtype: "float32" },
      { name: "dense_3/kernel", shape: [128, 15], dtype: "float32" },
      { name: "dense_3/bias", shape: [15], dtype: "float32" }
    ]
  }]
});