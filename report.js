(function () {
  "use strict";
  const spaceIdField = "spaceId";
  const userField = "user";
  const statisticsAppId = 1729;
  const prefix = "a_";

  kintone.events.on(
    ["app.record.create.submit.success", "app.record.edit.submit.success"],
    async (event) => {
      // 获取spaceid
      const appId = kintone.app.getId();
      const { spaceId } = await kintone.api(
        kintone.api.url("/k/v1/app", true),
        "GET",
        { id: appId }
      );

      //根据指定前缀的字段名，进行整理获取
      const { record } = event;
      const answerRecord = { [userField]: { value: record[userField].value } };
      Object.keys(record).forEach((value) => {
        if (value.indexOf(prefix) === 0) {
          answerRecord[value] = {
            value: record[value].value,
          };
        }
      });

      //根据spaceid查询是否已经有记录
      const query = `${spaceIdField} = ${spaceId} limit 1`;
      const params = {
        app: statisticsAppId,
        query,
      };
      const result = await kintone.api(
        kintone.api.url("/k/v1/records", true),
        "GET",
        params
      );
      const { records } = result;

      //根据查询结果，添加或者更新答案记录
      const method = records.length > 0 ? "PUT" : "POST";
      let data = {
        app: statisticsAppId,
        record: answerRecord,
      };
      if (records.length > 0) {
        data.updateKey = {
          field: spaceIdField,
          value: spaceId,
        };
      } else {
        data.record[spaceIdField] = { value: spaceId };
      }
      await kintone.api(kintone.api.url("/k/v1/record", true), method, data);
      return event;
    }
  );
})();
