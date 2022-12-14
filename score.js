(function () {
  "use strict";
  const spaceIdField = "spaceId";
  const scoreField = "score";
  const answerAppId = 453;
  const prefix = "a_";

  const getAllRecords = (app) => {
    return kintone.api(kintone.api.url("/k/v1/records", true), "GET", {
      app,
    });
  };

  //获取所有记录，获取答案，比对答案，计算成绩，批量更新成绩。
  const setScore = async () => {
    const app = kintone.app.getId();
    const { records } = await getAllRecords(app);
    const { records: answerRecords } = await getAllRecords(answerAppId);
    const answer = answerRecords[0];
    const newRecords = records.map((record) => {
      let score = 0;
      Object.keys(record).forEach((value) => {
        if (value.indexOf(prefix) === 0) {
          if (record[value].value === answer[value].value) {
            score += 10;
          }
        }
      });
      return {
        id: record.$id.value,
        record: {
          [scoreField]: {
            value: score,
          },
        },
      };
    });

    const updateData = {
      app,
      records: newRecords,
    };
    await kintone.api(
      kintone.api.url("/k/v1/records", true),
      "PUT",
      updateData
    );
  };

  kintone.events.on("app.record.index.show", async (event) => {
    //放置按钮
    if (document.getElementById("score") !== null) {
      return;
    }
    const button = document.createElement("button");
    button.id = "score";
    button.classList.add("kintoneplugin-button-normal");
    button.innerText = "一键批改";
    button.onclick = () => {
      setScore().then(() => {
        new swal("批改完成", "一键批改完成！", "success").then((value) => {
          window.location.reload();
        });
      });
    };
    kintone.app.getHeaderMenuSpaceElement().appendChild(button);
    return event;
  });

  kintone.events.on("app.record.detail.show", async (event) => {
    if (document.getElementById("userScore") !== null) {
      return;
    }
    const { record } = event;
    const scoreEl = document.createElement("div");
    scoreEl.id = "userScore";
    scoreEl.innerHTML = `<span style="color:red;">您的成绩为：${record.score.value}分</span>`;
    if (record.score.value != "") {
      kintone.app.record.getHeaderMenuSpaceElement().appendChild(scoreEl);
    }
    return event;
  });
})();
