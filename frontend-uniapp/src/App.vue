<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";

onLaunch(() => {
  console.log("AI customer service mini app launch");
});

onShow(() => {
  console.log("AI customer service mini app show");
});

onHide(() => {
  console.log("AI customer service mini app hide");
});
</script>

<style lang="scss">
page {
  background: #f5f7ef;
  color: #18243c;
  font-family:
    "PingFang SC",
    "Hiragino Sans GB",
    "Microsoft YaHei",
    sans-serif;
}

button {
  border: none;
}

button::after {
  border: none;
}
</style>
