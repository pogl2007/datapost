import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';

async function main() {
  const passwordHash = await bcrypt.hash('test12345', 12);

  const user = await prisma.user.upsert({
    where: { email: 'test@datapost.ru' },
    update: {},
    create: {
      email: 'test@datapost.ru',
      passwordHash,
      name: 'Тестовый Пользователь',
      plan: 'PRO',
      planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.dataset.deleteMany({ where: { userId: user.id } });

  const datasets = [
    {
      fileName: 'customer_churn.csv',
      fileSize: 2_453_120,
      rowCount: 14032,
      colCount: 21,
      format: 'CSV',
      qualityScore: 78,
      issueCount: 6,
      criticalCount: 1,
      summary:
        'Датасет в целом пригоден для обучения модели оттока клиентов. Обнаружена одна критичная проблема — утечка целевой переменной через колонку "cancellation_date", которая напрямую коррелирует с таргетом. После устранения утечки и обработки пропусков датасет будет готов к использованию.',
      issues: [
        {
          id: 'i1',
          severity: 'critical',
          type: 'target_leakage',
          title: 'Утечка целевой переменной',
          column: 'cancellation_date',
          description:
            'Колонка "cancellation_date" заполнена только для клиентов с оттоком (target=1), что напрямую раскрывает целевую переменную модели. Это приведёт к идеальным метрикам на трейне и провалу в проде.',
          fix_code: "df = df.drop(columns=['cancellation_date'])",
          chartType: 'bar',
        },
        {
          id: 'i2',
          severity: 'warning',
          type: 'class_imbalance',
          title: 'Дисбаланс классов',
          column: 'churn',
          description:
            'Класс "churn=1" составляет всего 12% выборки. Модель может быть смещена в сторону мажоритарного класса. Рекомендуется использовать class_weight или oversampling.',
          fix_code:
            "from sklearn.utils import class_weight\nweights = class_weight.compute_class_weight('balanced', classes=[0,1], y=df['churn'])",
          chartType: 'donut',
        },
        {
          id: 'i3',
          severity: 'warning',
          type: 'missing_data',
          title: 'Пропущенные значения',
          column: 'monthly_charges',
          description: 'В колонке "monthly_charges" обнаружено 4.3% пропущенных значений.',
          fix_code: "df['monthly_charges'] = df['monthly_charges'].fillna(df['monthly_charges'].median())",
          chartType: 'bar',
        },
        {
          id: 'i4',
          severity: 'info',
          type: 'outliers',
          title: 'Выбросы в числовой колонке',
          column: 'tenure_months',
          description: 'Обнаружено 23 выброса (за пределами 3 сигм) в колонке "tenure_months".',
          fix_code:
            "q1, q3 = df['tenure_months'].quantile([0.25, 0.75])\niqr = q3 - q1\ndf = df[(df['tenure_months'] >= q1 - 1.5*iqr) & (df['tenure_months'] <= q3 + 1.5*iqr)]",
          chartType: 'scatter',
        },
      ],
      stats: { rows: 14032, cols: 21 },
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      fileName: 'house_prices.xlsx',
      fileSize: 5_820_000,
      rowCount: 21613,
      colCount: 19,
      format: 'Excel',
      qualityScore: 91,
      issueCount: 3,
      criticalCount: 0,
      summary:
        'Датасет высокого качества, готов к обучению модели регрессии цен на недвижимость. Обнаружены незначительные проблемы: небольшая доля пропусков и умеренное количество выбросов в цене.',
      issues: [
        {
          id: 'i1',
          severity: 'warning',
          type: 'outliers',
          title: 'Выбросы в цене',
          column: 'price',
          description: 'Обнаружено 47 объектов с ценой выше 99-го перцентиля — вероятно, элитная недвижимость.',
          fix_code: "df = df[df['price'] < df['price'].quantile(0.99)]",
          chartType: 'histogram',
        },
        {
          id: 'i2',
          severity: 'info',
          type: 'missing_data',
          title: 'Пропуски в году реновации',
          column: 'yr_renovated',
          description: 'В колонке "yr_renovated" 2.1% пропусков — вероятно, объекты без реновации.',
          fix_code: "df['yr_renovated'] = df['yr_renovated'].fillna(0)",
          chartType: 'bar',
        },
        {
          id: 'i3',
          severity: 'info',
          type: 'duplicates',
          title: 'Дублирующиеся строки',
          column: null,
          description: 'Найдено 12 полностью дублирующихся строк.',
          fix_code: 'df = df.drop_duplicates()',
          chartType: 'bar',
        },
      ],
      stats: { rows: 21613, cols: 19 },
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
    {
      fileName: 'fraud_transactions.json',
      fileSize: 8_930_500,
      rowCount: 45211,
      colCount: 15,
      format: 'JSON',
      qualityScore: 44,
      issueCount: 9,
      criticalCount: 3,
      summary:
        'Датасет требует серьёзной доработки перед обучением. Обнаружены критичные проблемы: сильнейший дисбаланс классов (0.2% положительного класса), утечка через колонку "flagged_by_system" и большое количество пропусков в ключевых признаках.',
      issues: [
        {
          id: 'i1',
          severity: 'critical',
          type: 'class_imbalance',
          title: 'Экстремальный дисбаланс классов',
          column: 'is_fraud',
          description: 'Положительный класс составляет всего 0.2% выборки — модель без балансировки будет бесполезна.',
          fix_code:
            "from imblearn.over_sampling import SMOTE\nX_res, y_res = SMOTE().fit_resample(X, y)",
          chartType: 'donut',
        },
        {
          id: 'i2',
          severity: 'critical',
          type: 'target_leakage',
          title: 'Утечка через служебную колонку',
          column: 'flagged_by_system',
          description: 'Колонка "flagged_by_system" заполняется постфактум системой обнаружения мошенничества и коррелирует с таргетом на 0.94.',
          fix_code: "df = df.drop(columns=['flagged_by_system'])",
          chartType: 'bar',
        },
        {
          id: 'i3',
          severity: 'critical',
          type: 'missing_data',
          title: 'Массовые пропуски',
          column: 'device_fingerprint',
          description: 'В колонке "device_fingerprint" пропущено 62% значений.',
          fix_code: "df = df.drop(columns=['device_fingerprint'])",
          chartType: 'bar',
        },
        {
          id: 'i4',
          severity: 'warning',
          type: 'outliers',
          title: 'Аномальные суммы транзакций',
          column: 'amount',
          description: 'Обнаружено 340 транзакций с суммой, превышающей норму в 50 раз.',
          fix_code: "df = df[df['amount'] < df['amount'].quantile(0.995)]",
          chartType: 'scatter',
        },
      ],
      stats: { rows: 45211, cols: 15 },
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      fileName: 'employee_attrition.csv',
      fileSize: 1_120_400,
      rowCount: 1470,
      colCount: 35,
      format: 'CSV',
      qualityScore: 85,
      issueCount: 4,
      criticalCount: 0,
      summary:
        'Хороший датасет для задачи классификации оттока сотрудников. Небольшой дисбаланс классов и пара колонок с низкой дисперсией, которые можно удалить.',
      issues: [
        {
          id: 'i1',
          severity: 'warning',
          type: 'class_imbalance',
          title: 'Дисбаланс классов',
          column: 'Attrition',
          description: 'Класс "Yes" составляет 16% выборки.',
          fix_code:
            "df_majority = df[df.Attrition=='No']\ndf_minority = df[df.Attrition=='Yes']\ndf_minority_upsampled = df_minority.sample(len(df_majority), replace=True)",
          chartType: 'donut',
        },
        {
          id: 'i2',
          severity: 'info',
          type: 'low_variance',
          title: 'Низкая дисперсия признака',
          column: 'Over18',
          description: 'Колонка "Over18" содержит единственное значение "Y" во всех строках — не несёт информации.',
          fix_code: "df = df.drop(columns=['Over18'])",
          chartType: 'bar',
        },
        {
          id: 'i3',
          severity: 'info',
          type: 'wrong_dtype',
          title: 'Некорректный тип данных',
          column: 'EmployeeCount',
          description: 'Колонка "EmployeeCount" содержит константу 1 и должна быть удалена или проверена.',
          fix_code: "df = df.drop(columns=['EmployeeCount'])",
          chartType: 'bar',
        },
      ],
      stats: { rows: 1470, cols: 35 },
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      fileName: 'sales_forecast_2025.csv',
      fileSize: 3_340_000,
      rowCount: 8760,
      colCount: 12,
      format: 'CSV',
      qualityScore: 67,
      issueCount: 5,
      criticalCount: 1,
      summary:
        'Датасет для прогноза продаж требует внимания: обнаружена утечка через колонку с будущими данными, а также заметные пропуски в погодных признаках.',
      issues: [
        {
          id: 'i1',
          severity: 'critical',
          type: 'target_leakage',
          title: 'Утечка данных из будущего',
          column: 'next_week_sales',
          description: 'Колонка "next_week_sales" содержит данные, недоступные на момент предсказания.',
          fix_code: "df = df.drop(columns=['next_week_sales'])",
          chartType: 'bar',
        },
        {
          id: 'i2',
          severity: 'warning',
          type: 'missing_data',
          title: 'Пропуски в погодных данных',
          column: 'temperature',
          description: 'В колонке "temperature" 8.7% пропусков.',
          fix_code: "df['temperature'] = df['temperature'].interpolate()",
          chartType: 'bar',
        },
        {
          id: 'i3',
          severity: 'info',
          type: 'duplicates',
          title: 'Дублирующиеся записи',
          column: null,
          description: 'Найдено 5 дублирующихся строк по ключевым полям.',
          fix_code: 'df = df.drop_duplicates(subset=["date", "store_id"])',
          chartType: 'bar',
        },
      ],
      stats: { rows: 8760, cols: 12 },
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const d of datasets) {
    await prisma.dataset.create({
      data: {
        userId: user.id,
        fileName: d.fileName,
        fileSize: d.fileSize,
        rowCount: d.rowCount,
        colCount: d.colCount,
        format: d.format,
        status: 'COMPLETED',
        qualityScore: d.qualityScore,
        issueCount: d.issueCount,
        criticalCount: d.criticalCount,
        summary: d.summary,
        issues: d.issues,
        stats: d.stats,
        createdAt: d.createdAt,
        completedAt: new Date(d.createdAt.getTime() + 8000),
      },
    });
  }

  console.log('Seed complete. Test user: test@datapost.ru / test12345');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
