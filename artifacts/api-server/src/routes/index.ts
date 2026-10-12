import { Router, type IRouter } from "express";
import healthRouter from "./health";
import greenrouteRouter from "./greenroute";

const router: IRouter = Router();

router.use(healthRouter);
router.use(greenrouteRouter);

export default router;
