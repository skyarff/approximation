class ComponentModel {
    constructor(learningRate = 0.0005) {
        this.learningRate = learningRate;
        this.weights = null;
        this.bias = null;
        this.m = 0;
        this.n = 0;
       this.beta1 = 0.9;
      this.beta2 = 0.999;
        this.epsilon = 1e-8;
        this.m_dw = null;
       this.v_dw = null;
        this.m_db = 0;
        this.v_db = 0;
        this.t = 0;
   }


    standardize(X) {
      if (!X || X.length === 0 || X[0].length === 0) {
          console.error("Ошибка: пустой массив или неправильная размерность в standardize");
          return X;
        }
      if (!this.means || !this.stds) {
            this.means = X[0].map((_, colIndex) => {
               const column = X.map(row => row[colIndex]);
                const mean = column.reduce((a, b) => a + b, 0) / column.length;
                 return isFinite(mean) ? mean : 0;
            });
            this.stds = X[0].map((_, colIndex) => {
                 const column = X.map(row => row[colIndex]);
                 const mean = this.means[colIndex];
                const squaredDiffs = column.map(x => Math.pow(x - mean, 2));
                const std = Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / column.length);
                return isFinite(std) ? (std === 0 ? 1 : std) : 1;
            });
        }


       return X.map(row =>
          row.map((val, i) => {
               const standardizedVal = (val - this.means[i]) / this.stds[i];
             return isFinite(standardizedVal) ? standardizedVal : 0
           })
        );
   }

    fit(X, y) {
         this.m = X.length;
        this.n = X[0].length;
      const yMean = y.reduce((a, b) => a + b, 0) / this.m;
         const yStd = Math.sqrt(y.reduce((a, b) => a + (b - yMean) ** 2, 0) / this.m) || 1;
       const y_normalized = y.map(val => (val - yMean) / yStd);


        this.yMean = yMean;
         this.yStd = yStd;


       const X_scaled = this.standardize(X);
         this.weights = Array(this.n).fill(0).map(() => (Math.random() - 0.5) * Math.sqrt(2.0 / this.n));
       this.bias = 0;
         this.m_dw = Array(this.n).fill(0);
        this.v_dw = Array(this.n).fill(0);


        let bestLoss = Infinity;
        let bestWeights = [...this.weights];
        let bestBias = this.bias;
        let currentLR = this.learningRate;
        let patience = 20;
        let noImprovement = 0;
       const regularizationStrength = 0.1;


         this.t = 0;
        for (let epoch = 0; epoch < 400; epoch++) { // Увеличили кол-во эпох
           const batchSize = 32;
           let epochLoss = 0;


          for (let i = 0; i < this.m; i += batchSize) {
               const batchEnd = Math.min(i + batchSize, this.m);
              const X_batch = X_scaled.slice(i, batchEnd);
                const y_batch = y_normalized.slice(i, batchEnd);
              const batchM = X_batch.length;

              const predictions = X_batch.map(row =>
                  row.reduce((sum, val, j) => sum + val * this.weights[j], 0) + this.bias
             );

               const errors = predictions.map((pred, j) => pred - y_batch[j]);
             let batchLoss = errors.reduce((sum, err) => sum + err * err, 0) / (2 * batchM);


               batchLoss += regularizationStrength * this.weights.reduce((sum, w) => sum + w*w, 0) / (2* batchM);

               epochLoss += batchLoss * batchM;


                const weightGradients = this.weights.map((_, j) => {
                    return errors.reduce((sum, err, k) => sum + err * X_batch[k][j], 0) / batchM;
              });
              const biasGradient = errors.reduce((sum, err) => sum + err, 0) / batchM;


               this.t++;
              for (let j = 0; j < this.n; j++) {
                  this.m_dw[j] = this.beta1 * this.m_dw[j] + (1 - this.beta1) * weightGradients[j];
                   this.v_dw[j] = this.beta2 * this.v_dw[j] + (1 - this.beta2) * weightGradients[j] ** 2;
                   const m_dw_corr = this.m_dw[j] / (1 - this.beta1**this.t);
                  const v_dw_corr = this.v_dw[j] / (1 - this.beta2**this.t);
                  this.weights[j] -= currentLR * m_dw_corr / (Math.sqrt(v_dw_corr) + this.epsilon);

                  this.weights[j] = this.weights[j].clip(-1e5, 1e5)
              }
              this.m_db = this.beta1 * this.m_db + (1 - this.beta1) * biasGradient;
              this.v_db = this.beta2 * this.v_db + (1 - this.beta2) * biasGradient ** 2;
             const m_db_corr = this.m_db / (1 - this.beta1**this.t);
                const v_db_corr = this.v_db / (1 - this.beta2**this.t);
             this.bias -= currentLR * m_db_corr / (Math.sqrt(v_db_corr) + this.epsilon);
          }


            epochLoss /= this.m;
            if (epochLoss < bestLoss - 1e-4) {
               bestLoss = epochLoss;
                bestWeights = [...this.weights];
               bestBias = this.bias;
              noImprovement = 0;
           } else {
               noImprovement++;
                if (noImprovement > patience) {
                   currentLR *= 0.5;
                   noImprovement = 0;
                 if (currentLR < 1e-8) break;
               }
          }

            if (epoch % 20 === 0) {
                console.log(`Эпоха ${epoch}, Loss: ${epochLoss}, LR: ${currentLR}`);
              console.log("Текущие веса:", this.weights);
                console.log("Текущее смещение:", this.bias);
           }
       }
      this.weights = bestWeights;
         this.bias = bestBias;
       return this;
  }
    predict(X) {
         const X_scaled = this.standardize(X);
      const scaledPredictions = X_scaled.map(row =>
            row.reduce((sum, val, i) => sum + val * this.weights[i], 0) + this.bias
      );
         return scaledPredictions.map(pred => pred * this.yStd + this.yMean);
   }
}
class MetaModel {
   constructor(learningRate = 0.0005) {
      this.learningRate = learningRate;
        this.weights = null;
        this.means = null;
         this.stds = null;
        this.beta1 = 0.9;
        this.beta2 = 0.999;
       this.epsilon = 1e-8;
        this.m_dw = null;
       this.v_dw = null;
         this.t = 0;
   }

    standardize(X) {
      if (!X || X.length === 0 || X[0].length === 0) {
            console.error("Ошибка: пустой массив или неправильная размерность в standardize");
           return X;
        }
      const m = X.length;
         const n = X[0].length;
       if (!this.means || !this.stds) {
           this.means = new Array(n).fill(0);
           this.stds = new Array(n).fill(0);
            for (let j = 0; j < n; j++) {
                for (let i = 0; i < m; i++) {
                    this.means[j] += X[i][j];
              }
               this.means[j] = isFinite(this.means[j] / m) ?  this.means[j] / m : 0;
           }

         for (let j = 0; j < n; j++) {
                for (let i = 0; i < m; i++) {
                    this.stds[j] += Math.pow(X[i][j] - this.means[j], 2);
              }
               const std = Math.sqrt(this.stds[j] / m) || 1;
               this.stds[j] = isFinite(std) ? (std === 0 ? 1 : std) : 1;
          }
      }

       return X.map(row =>
            row.map((val, j) => {
                 const standardizedVal = (val - this.means[j]) / this.stds[j];
                return isFinite(standardizedVal) ? standardizedVal : 0
           })
      );
    }

    generateFeatures(X) {
       const m = X.length;
        const features = [];
       for (let i = 0; i < m; i++) {
            const row = [
                ...X[i],
                ...X[i].map(x => Math.exp(-Math.abs(x))),
                ...X[i].map(x => Math.sin(Math.PI * x))
            ];
            features.push(row);
        }
       return features;
    }
    gradientDescent(features, y, maxIterations = 200) {
       const m = features.length;
        const n = features[0].length;
         this.weights = Array(n).fill(0).map(() => (Math.random() - 0.5) * 0.1);

        let bestLoss = Infinity;
        let bestWeights = [...this.weights];
        let currentLR = this.learningRate;
      const regularizationStrength = 0.1;
        this.m_dw = Array(n).fill(0);
         this.v_dw = Array(n).fill(0);

         console.log("Начало обучения мета-модели:");
       console.log("Размерность признаков:", [m, n]);
        console.log("Начальные веса:", this.weights);
         this.t = 0;

       for (let iter = 0; iter < maxIterations; iter++) {
            const predictions = features.map(row =>
                row.reduce((sum, val, i) => sum + val * this.weights[i], 0)
            );
           const errors = predictions.map((pred, i) => pred - y[i]);
            let currentLoss = errors.reduce((sum, err) => sum + err * err, 0) / (2 * m);


           currentLoss += regularizationStrength * this.weights.reduce((sum, w) => sum + w * w, 0) / (2*m);
           if (currentLoss < bestLoss) {
                bestLoss = currentLoss;
               bestWeights = [...this.weights];


              if (iter % 20 === 0) {
                 console.log(`Итерация ${iter}, Loss: ${currentLoss}`);
                   console.log("Текущие веса:", this.weights);
              }
         }


            const gradients = new Array(n).fill(0);
          for (let j = 0; j < n; j++) {
                 for (let i = 0; i < m; i++) {
                   gradients[j] += errors[i] * features[i][j];
              }
              gradients[j] /= m;
            }

           this.t++;
            for (let j = 0; j < n; j++) {
               this.m_dw[j] = this.beta1 * this.m_dw[j] + (1 - this.beta1) * gradients[j];
                this.v_dw[j] = this.beta2 * this.v_dw[j] + (1 - this.beta2) * gradients[j] ** 2;
                const m_dw_corr = this.m_dw[j] / (1 - this.beta1**this.t);
                const v_dw_corr = this.v_dw[j] / (1 - this.beta2**this.t);
                 this.weights[j] -= currentLR * m_dw_corr / (Math.sqrt(v_dw_corr) + this.epsilon);
               this.weights[j] = this.weights[j].clip(-1e5, 1e5)
            }

            if (iter > 0 && currentLoss > bestLoss) {
              currentLR *= 0.95;
            }
       }

       this.weights = bestWeights;
        console.log("Финальные веса мета-модели:", this.weights);
        console.log("Лучшая ошибка:", bestLoss);

        return bestWeights;
   }
  fit(X, y) {
        console.log("Начало обучения мета-модели");
        const standardizedX = this.standardize(X);

        const yMean = y.reduce((a, b) => a + b) / y.length;
      const yStd = Math.sqrt(y.reduce((a, b) => Math.pow(b - yMean, 2), 0) / y.length);
         this.yMean = yMean;
      this.yStd = yStd;
        const y_normalized = y.map(val => (val - yMean) / yStd);

       const features = this.generateFeatures(standardizedX);
        this.weights = this.gradientDescent(features, y_normalized);

        console.log("Обучение мета-модели завершено");
      return this;
    }
    predict(X) {
        const standardizedX = this.standardize(X);
        const features = this.generateFeatures(standardizedX);
       const scaledPredictions = features.map(row =>
           row.reduce((sum, val, i) => sum + val * (this.weights[i] || 0), 0)
      );
      return scaledPredictions.map(pred => pred * this.yStd + this.yMean);
  }
}


class AdvancedComponentPredictor {
    constructor(components = 10, metaComponents = 3, learningRate = 0.001) { // Увеличили `learningRate`
        this.components = components;
      this.metaComponents = metaComponents;
       this.learningRate = learningRate;
         this.baseModels = [];
      this.metaModel = null;
      this.correctionModel = null;
       this.xMeans = null;
       this.xStds = null;
        this.yMean = null;
       this.yStd = null;
  }
  generateComponents(X) {
      const nFeatures = X[0].length;
       const components = [];
       for (let i = 0; i < nFeatures; i++) {
            components.push(X.map(row =>
              (Math.exp(-0.5 * row[i]) * Math.sin(row[i] * 2)).clip(-10, 10) // Добавил clip
            ));
       }
        components.push(X.map(row =>
          (row.reduce((sum, val) => sum + val * val, 0)).clip(-100, 100)
        ));
       components.push(X.map(row =>
           (row.reduce((sum, val) => sum + Math.exp(-Math.abs(val)), 0)).clip(-10, 10) // Добавил clip
      ));

       for (let i = 0; i < nFeatures; i++) {
            components.push(X.map(row =>
                Math.sin(row[i]).clip(-1, 1) // Добавил clip
          ));
            components.push(X.map(row =>
              Math.cos(row[i]).clip(-1, 1) // Добавил clip
            ));
        }


      return components;
   }
    fit(X, y) {
        console.log("Обучение базовых моделей...");
      const yComponents = this.generateComponents(X);
       let selectedComponents = yComponents;


       if (yComponents.length > this.components) {
            const indices = new Array(yComponents.length).fill(0)
              .map((_, i) => i)
                .sort(() => Math.random() - 0.5)
                .slice(0, this.components);
           selectedComponents = indices.map(i => yComponents[i]);
       }

       const basePredictions = Array(X.length).fill(0).map(() => Array(this.components).fill(0));
       for (let i = 0; i < this.components; i++) {
            console.log(`Компонента ${i + 1}/${this.components}`);
             const model = new ComponentModel(this.learningRate);
           model.fit(X, selectedComponents[i]);
            this.baseModels.push(model);
           const predictions = model.predict(X);
           for (let j = 0; j < X.length; j++) {
               basePredictions[j][i] = predictions[j];
           }
       }


        console.log("Обучение мета-модели...");
       this.metaModel = new MetaModel(this.learningRate);
        this.metaModel.fit(basePredictions, y);
       console.log("Обучение коррекционной модели...");
        const metaPredictions = this.metaModel.predict(basePredictions);
       const residuals = y.map((val, i) => val - metaPredictions[i]);
        this.correctionModel = new ComponentModel(this.learningRate, 'high');
        this.correctionModel.fit(X, residuals);


      return this;
   }

    predict(X) {
       const basePredictions = Array(X.length).fill(0).map(() => Array(this.components).fill(0));
        for (let i = 0; i < this.components; i++) {
            const predictions = this.baseModels[i].predict(X);
            for (let j = 0; j < X.length; j++) {
                basePredictions[j][i] = predictions[j];
            }
       }


       const metaPredictions = this.metaModel.predict(basePredictions);
       const corrections = this.correctionModel.predict(X);
        const alpha = 0.7;
       return metaPredictions.map((pred, i) =>
            alpha * pred + (1 - alpha) * corrections[i]
        );
    }
    evaluate(X, y) {
        const predictions = this.predict(X);
       const r2 = this.calculateR2(y, predictions);
        const rmse = Math.sqrt(this.calculateMSE(y, predictions));
       const maxError = Math.max(...predictions.map((pred, i) => Math.abs(y[i] - pred)));
        const mae = predictions.reduce((sum, pred, i) => sum + Math.abs(y[i] - pred), 0) / y.length;
        const absoluteErrors = predictions.map((pred, i) => Math.abs(y[i] - pred)).sort((a, b) => a - b);
       const medianAE = absoluteErrors[Math.floor(absoluteErrors.length / 2)];


       return {
            'R2': r2,
          'RMSE': rmse,
            'MAX_ERROR': maxError,
           'MAE': mae,
           'MEDIAN_AE': medianAE
       };
    }
   calculateR2(yTrue, yPred) {
        const mean = yTrue.reduce((sum, val) => sum + val, 0) / yTrue.length;
       const totalSum = yTrue.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);
        const residualSum = yTrue.reduce((sum, val, i) => sum + Math.pow(val - yPred[i], 2), 0);
      return 1 - (residualSum / totalSum);
    }
     calculateMSE(yTrue, yPred) {
       return yTrue.reduce((sum, val, i) => sum + Math.pow(val - yPred[i], 2), 0) / yTrue.length;
   }
}
 Number.prototype.clip = function (min, max) {
    return Math.min(Math.max(this, min), max);
};


export { AdvancedComponentPredictor };