(function () {
  "use strict";
  const spaceIdField = "spaceId";
  const userField = "user";
  const dateField = "date";
  const statisticsAppId = 452;
  const prefix = "a_";
  const token = "wq7qQf05coYQFC1FLms4yE4mwUUKIVU8fxufJjIk";

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

      const date = new Date();
      var y = date.getUTCFullYear();
      var m = date.getUTCMonth() + 1;
      var d = date.getUTCDate();
      var h = date.getUTCHours();
      var M = date.getUTCMinutes();
      var s = date.getUTCSeconds();
      const utcDate = `${y}-${m}-${d}T${h}:${M}:${s}Z`;

      answerRecord[dateField] = {
        value: utcDate,
      };

      //根据spaceid查询是否已经有记录
      const getHeaders = {
        "X-Cybozu-API-Token": token,
      };
      const query = `${spaceIdField} = "${spaceId}" limit 1`;
      const url = `${kintone.api.url(
        "/k/v1/records",
        true
      )}?app=${statisticsAppId}&query=${encodeURIComponent(query)}`;

      const result = await kintone.proxy(url, "GET", getHeaders, {});
      const { records } = JSON.parse(result[0]);

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
      const postHeaders = {
        "Content-Type": "application/json",
        "X-Cybozu-API-Token": token,
      };
      await kintone.proxy(
        kintone.api.url("/k/v1/record", true),
        method,
        postHeaders,
        data
      );
      return event;
    }
  );
})();
