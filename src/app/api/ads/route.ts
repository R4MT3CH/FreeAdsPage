import {authOptions} from "@/libs/authOptions";
import {connect} from "@/libs/helpers";
import {Ad, AdModel} from "@/models/Ad";
import {FilterQuery, PipelineStage} from "mongoose";
import {getServerSession} from "next-auth";

function splitCoordinates(coords: string) {
  const parts = coords.match(/-?\d+(\.\d+)?/g);
  if (parts && parts.length === 2) {
      return parts.map(parseFloat);
  }
  throw new Error("Input string is not in the correct format");
}

export async function GET(req: Request, res: Response) {
  await connect();
  const {searchParams} = new URL(req.url);

  const phrase = searchParams.get('phrase');
  const category = searchParams.get('category');
  const min = searchParams.get('min');
  const max = searchParams.get('max');
  const radius = searchParams.get('radius');
  const center = searchParams.get('center');

  const filter:FilterQuery<Ad> = {};
  const aggregationSteps:PipelineStage[] = [];
  if (phrase) {
    filter.title = {$regex: '.*'+phrase+'.*', $options: 'i'};
  }
  if (category) {
    filter.category = category;
  }
  if (min && !max) filter.price = {$gte: min};
  if (max && !min) filter.price = {$lte: max};
  if (min && max) filter.price = {$gte: min, $lte: max};

  if (radius && center) {

    const [coord1, coord2] = splitCoordinates(center);
    const lat = coord1;
    const lng = coord2;

    console.log(lat,lng)



    aggregationSteps.push(
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [ lng, lat ]
          },
          query: filter,
          includeLocs: 'location',
          distanceField: 'distance',
          maxDistance: parseInt(radius),
          spherical: true,
        }
      }
    );
  }

  // aggregationSteps.push({
  //   $sort: {createdAt:-1},
  // });

  aggregationSteps.push({ $match: filter }, { $sort: { createdAt: -1 } });
  const adsDocs = await AdModel.aggregate(aggregationSteps);
  return Response.json(adsDocs);
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  await connect();
  const adDoc = await AdModel.findById(id);
  const session = await getServerSession(authOptions);
  if (!adDoc || adDoc.userEmail !== session?.user?.email) {
    return Response.json(false);
  }
  await AdModel.findByIdAndDelete(id);
  return Response.json(true);
}