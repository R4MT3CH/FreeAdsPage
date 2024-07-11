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
  const filter:FilterQuery<Ad> = {};
  const phrase = searchParams.get('phrase') || null;
  const category = searchParams.get('category');
  const min = searchParams.get('min');
  const max = searchParams.get('max');
  const radius = searchParams.get('radius');
  const center = searchParams.get('center');
  
  if (phrase) {
    filter.title = {$regex: '.*'+phrase+'.*', $options: 'i'};
  }

  const aggregationSteps:PipelineStage[] = [];
  
  if (category) {
    filter.category = category;
  }
  if (min && !max) filter.price = {$gte: parseFloat(min)};
  if (max && !min) filter.price = {$lte: parseFloat(max)};
  if (min && max) filter.price = {$gte: parseFloat(min), $lte:parseFloat(max)};


  if (radius && center) {

    const [coord1, coord2] = splitCoordinates(center);
    // console.log(coord1, coord2);

    aggregationSteps.push(
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [parseFloat(coord2),parseFloat(coord1)]
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

  aggregationSteps.push({ $match: filter }, { $sort: { createdAt: -1 } });

  // AdModel.find(filter, null, {sort:{createdAt:-1}})
  // const adsDocs = await AdModel.find(filter, null, {sort:{createdAt:-1}})
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